import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import "./App.css";
import {
  Button,
  MenuItem,
  TextField,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"; // Correct import here
import { useForm, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import dayjs from "dayjs";

// Import React FilePond
import { FilePond } from "react-filepond";

// Import FilePond styles
import "filepond/dist/filepond.min.css";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DatePicker } from "@mui/x-date-pickers";
// import dayjs from "dayjs";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ size: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: ["red", "black", "#ffff00", "#15ff00", "#004cff"] }],
    [{ background: ["red", "black", "#ffff00", "#15ff00", "#004cff"] }],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "color",
  "background",
  "align",
  "image",
];

const ZOHO = window.ZOHO;

function App() {
  let dateMap = { Low: 4, Medium: 1, High: 0 };

  const { handleSubmit, control, watch, setValue, formState } = useForm({
    defaultValues: {
      subject: "",
      description: "",
      classification: null,
      priority: null,
      // due_date: null,
    },
  });

  const watchAllFields = watch();

  const [initialLoading, setInitialLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [entityId, setEntityId] = useState();
  const [vendor, setVendor] = useState();
  // const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedFile, setSelectedFile] = useState();
  const { isValid } = formState;

  const [zohoLoaded, setZohoLoaded] = useState(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", async function (data) {
      // console.log(data?.EntityId);
      setEntityId(data?.EntityId);
      await ZOHO.CRM.API.getRecord({
        Entity: data.Entity,
        RecordID: data?.EntityId,
      }).then(async function (data) {
        let result = data?.data?.[0];
        if (result?.Project_Assignment?.id) {
          await ZOHO.CRM.API.getRecord({
            Entity: "Project_Assignment",
            RecordID: result?.Project_Assignment?.id,
          }).then(async function (output) {
            let pa_resp = output?.data?.[0];
            if (pa_resp?.Vendor?.id) {
              await ZOHO.CRM.API.getRecord({
                Entity: "Vendors",
                RecordID: pa_resp?.Vendor?.id,
              }).then(async function (vendorOutput) {
                let vendor_resp = vendorOutput?.data?.[0];
                // console.log({ v: vendorOutput?.data?.[0] });
                setVendor(vendor_resp);
              });

              await ZOHO.CRM.API.getRecord({
                Entity: "Contacts",
                RecordID: pa_resp?.Vendor_Contact_s?.id,
              }).then(async function (contactOutput) {
                let contact_resp = contactOutput?.data?.[0];
                console.log({ contact_resp });
                setSelectedContact(contact_resp);
              });

              // await ZOHO.CRM.API.getRelatedRecords({
              //   Entity: "Vendors",
              //   RecordID: pa_resp?.Vendor?.id,
              //   RelatedList: "Contacts",
              //   page: 1,
              //   per_page: 200,
              // }).then(function (contact_list) {
              //   // console.log({ contact_list: contact_list?.data });
              //   setContacts(contact_list?.data || []);
              // });
            }
          });
        }
      });
      setInitialLoading(false);
      //Custom Bussiness logic goes here
      // console.log(data);
    });
    /*
     * initializing the widget.
     */
    ZOHO.embeddedApp.init().then(() => {
      setZohoLoaded(true);
      ZOHO.CRM.UI.Resize({ height: "600", width: "700" }).then(function (data) {
        // console.log(data);
      });
    });
  }, []);

  useEffect(() => {
    async function getData() {
      if (zohoLoaded) {
        let func_name = "Zoho_desk_ticket_handle_from_milestones";
        let data = {
          department_and_agents: true,
        };
        await ZOHO.CRM.FUNCTIONS.execute(func_name, data).then(async function (
          result
        ) {
          let resp = JSON.parse(result?.details?.output);
          setDepartments(resp.departments);
          setAgents(resp.agents);
          // console.log({ D: resp.departments });
          // console.log({ A: resp.agents });
        });
      }
    }
    getData();
  }, [zohoLoaded]);

  const handleCloseWidget = async () => {
    await ZOHO.CRM.UI.Popup.closeReload().then(function (data) {
      console.log(data);
    });
  };

  const uploadAttachment = async () => {
    let attachmentIds = [];
    try {
      await Promise.all(
        selectedFile?.map(async (element) => {
          const upload_resp = await ZOHO.CRM.API.attachFile({
            Entity: "Milestones",
            RecordID: entityId,
            File: { Name: element?.file?.name, Content: element?.file },
          });
          // console.log(upload_resp);
          if (upload_resp?.data?.[0]?.details?.id) {
            attachmentIds.push(upload_resp?.data?.[0]?.details?.id);
          }
        })
      );
    } catch (error) {
      setSnackbarMessage("File Upload Error. Please try again later!!!");
      setOpenSnackbar(true);
      setCreateLoading(false);
    }
    return attachmentIds;
  };

  const onSubmit = async (data) => {
    try {
      setCreateLoading(true);
      let email = selectedContact ? selectedContact?.Email.toLowerCase() : null;
      let conn_name = "zoho_desk_conn";
      let req_data = {
        method: "GET",
        url: `https://desk.zoho.com/api/v1/contacts/search?limit=1&email=${encodeURIComponent(
          email
        )}`,
        param_type: 1,
      };
      ZOHO.CRM.CONNECTION.invoke(conn_name, req_data).then(async function (
        contact_search_data
      ) {
        let desk_contact_id =
          contact_search_data?.details?.statusMessage?.data?.[0]?.id;
        if (desk_contact_id) {
          let create_req_data = {
            parameters: {
              cf: { cf_milestone_id: entityId },
              departmentId: selectedDepartment?.id,
              assigneeId: selectedAgent?.id ? selectedAgent?.id : null,
              contactId: desk_contact_id,
              subject: data?.subject,
              description: data?.description,
              priority: data?.priority,
              classification: data?.classification,
              phone: selectedContact?.Phone ? selectedContact?.Phone : null,
              email: email,
              status: "Open",
              channel: "Web",
            },
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
            url: "https://desk.zoho.com/api/v1/tickets",
            param_type: 2,
          };
          ZOHO.CRM.CONNECTION.invoke(conn_name, create_req_data).then(
            async function (create_resp) {
              let newly_created_ticket_id =
                create_resp?.details?.statusMessage?.id;
              if (newly_created_ticket_id) {
                await ZOHO.CRM.API.addNotes({
                  Entity: "Milestones",
                  RecordID: entityId,
                  Content: `Ticket Number: ${create_resp?.details?.statusMessage?.ticketNumber} created`,
                });
                if (selectedFile?.length > 0) {
                  let attachment_Ids = await uploadAttachment();
                  let upload_func_name =
                    "bcrm_upload_file_into_related_desk_ticket";
                  let req_data_attachment = {
                    record_id: entityId,
                    ticket_id: newly_created_ticket_id,
                    attachment_ids: JSON.stringify(attachment_Ids),
                  };
                  await ZOHO.CRM.FUNCTIONS.execute(
                    upload_func_name,
                    req_data_attachment
                  ).then(async function (result) {
                    let resp = JSON.parse(
                      result?.details?.output ? result?.details?.output : "{}"
                    );
                    if (resp?.status === "success") {
                      handleCloseWidget();
                    }
                  });
                } else {
                  handleCloseWidget();
                }
              } else {
                setSnackbarMessage(
                  "Something went wrong. Please try again later!!!"
                );
                setOpenSnackbar(true);
                setCreateLoading(false);
              }
            }
          );
        } else {
          setSnackbarMessage(
            "No contact was found for this vendor on Zoho Desk"
          );
          setOpenSnackbar(true);
          setCreateLoading(false);
        }
      });
    } catch (error) {
      setSnackbarMessage(error?.message);
      setOpenSnackbar(true);
      setCreateLoading(false);
    }
  };

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [filteredAgents, setFilteredAgents] = useState([]);

  useEffect(() => {
    if (selectedDepartment) {
      let related_agents = agents[selectedDepartment.id];
      setFilteredAgents(related_agents);
      if (selectedDepartment?.id === "592678000020442029") {
        let findAgent = related_agents?.find(
          (item) => item?.emailId === vendor?.Contact_Email?.toLowerCase()
        );
        if (findAgent) {
          setSelectedAgent(findAgent);
        }
      }
      // else {
      //   setSelectedContact(null);
      // }
    }
  }, [selectedDepartment]);
  return (
    <Box sx={{ m: 4 }}>
      {initialLoading ? (
        <Box sx={{ mt: 15, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <>
          <Typography sx={{ fontSize: 20, textAlign: "center", mb: 3 }}>
            Create a Ticket
          </Typography>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Autocomplete
                  id="department-autocomplete"
                  options={departments}
                  size="small"
                  getOptionLabel={(option) => option.nameInCustomerPortal}
                  fullWidth
                  value={selectedDepartment}
                  onChange={(event, newValue) => {
                    setSelectedDepartment(newValue);
                    setSelectedAgent(null); // Clear the selected agent when department changes
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Department"
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                {" "}
                <Autocomplete
                  id="agent-autocomplete"
                  size="small"
                  disabled={!selectedDepartment?.id}
                  options={filteredAgents}
                  fullWidth
                  getOptionLabel={(option) =>
                    `${option.firstName} ${option.lastName}`
                  }
                  value={selectedAgent}
                  onChange={(event, newValue) => {
                    setSelectedAgent(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ticket Owner"
                      variant="outlined"
                      disabled={!selectedDepartment}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              {/* {selectedDepartment?.id === "592678000020442029" && (
                <Grid item xs={6}>
                  <Autocomplete
                    id="contact-autocomplete"
                    options={contacts}
                    size="small"
                    getOptionLabel={(option) => option?.Full_Name}
                    fullWidth
                    value={selectedContact}
                    onChange={(event, newValue) => {
                      setSelectedContact(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Contact Reporting Issue"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              )} */}

              <Grid item xs={6}>
                <Controller
                  name="classification"
                  control={control}
                  defaultValue=""
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Classification"
                      InputLabelProps={{ shrink: true }}
                      {...field}
                    >
                      <MenuItem value="Problem/Issue">Problem/Issue</MenuItem>
                      <MenuItem value="Question">Question</MenuItem>
                      <MenuItem value="Feature">Feature</MenuItem>
                      <MenuItem value="Others">Others</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="priority"
                  control={control}
                  fullWidth
                  defaultValue=""
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Priority"
                      InputLabelProps={{ shrink: true }}
                      {...field}
                      // align="center"
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="subject"
                  control={control}
                  defaultValue=""
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      label="Subject"
                      type="text"
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <ReactQuill
                  theme="snow"
                  modules={modules}
                  formats={formats}
                  value={watchAllFields?.description}
                  onChange={(e) => setValue("description", e)}
                  // onChange={(e) => console.log("description", e)}
                />

                {/* <Controller
                  name="description"
                  control={control}
                  defaultValue=""
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      type="text"
                      label="Description"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      multiline
                      rows={7}
                      {...field}
                    />
                  )}
                /> */}
              </Grid>
              <Grid item xs={12}>
                <FilePond
                  files={selectedFile}
                  onupdatefiles={setSelectedFile}
                  allowMultiple={true}
                  labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                />
              </Grid>
              {/* <Grid item xs={6}>
            <Controller
              name="due_date"
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      disablePast
                      label="Due Date"
                      {...field}
                      inputProps={{
                        style: {
                          height: 18,
                        },
                      }}
                      onChange={(newValue) => {
                        field.onChange(dayjs(newValue).format("YYYY-MM-DD"));
                      }}
                      PopperProps={{
                        placement: "right-end",
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          fullWidth
                          size="small"
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                );
              }}
            />
          </Grid> */}
            </Grid>
            <Typography sx={{ mt: 1 }}>
              Due Date :{" "}
              {watchAllFields?.priority
                ? dayjs()
                    .add(
                      dateMap[watchAllFields?.priority]
                        ? dateMap[watchAllFields?.priority]
                        : 0,
                      "day"
                    )
                    .format("MM-DD-YYYY")
                : ""}
            </Typography>

            {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={["DateTimePicker"]}>
            <DateTimePicker label="Basic date time picker" />
          </DemoContainer>
        </LocalizationProvider> */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ width: 130, mr: 2 }}
                onClick={() =>
                  ZOHO.CRM.UI.Popup.close().then(function (data) {
                    console.log(data);
                  })
                }
              >
                Cancel
              </Button>
              <Button
                sx={{ width: 130 }}
                type="submit"
                size="small"
                variant="contained"
                disabled={!isValid || createLoading}
              >
                {createLoading ? <CircularProgress size={20} /> : "Create"}
              </Button>
            </Box>
          </form>
          <Snackbar
            open={openSnackbar}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity="error"
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
}

export default App;
