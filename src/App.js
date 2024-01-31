import React, { useEffect, useState } from "react";
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
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DatePicker } from "@mui/x-date-pickers";
// import dayjs from "dayjs";

const ZOHO = window.ZOHO;

function App() {
  const { handleSubmit, control, formState } = useForm({
    defaultValues: {
      subject: "",
      description: "",
      classification: null,
      priority: null,
      // due_date: null,
    },
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [entityId, setEntityId] = useState();
  const [vendor, setVendor] = useState();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
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

              await ZOHO.CRM.API.getRelatedRecords({
                Entity: "Vendors",
                RecordID: pa_resp?.Vendor?.id,
                RelatedList: "Contacts",
                page: 1,
                per_page: 200,
              }).then(function (contact_list) {
                // console.log({ contact_list: contact_list?.data });
                setContacts(contact_list?.data || []);
              });
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
      ZOHO.CRM.UI.Resize({ height: "570", width: "700" }).then(function (data) {
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

  const onSubmit = async (data) => {
    // console.log(selectedDepartment);
    // console.log(selectedAgent);
    console.log(data);
    setCreateLoading(true);
    let func_name = "Zoho_desk_ticket_handle_from_milestones";
    // {
    //   "cf": {
    //     "cf_milestone_id": "5035598000002136182"
    //   },
    //   "departmentId": "592678000020442029",
    //   "contactId": "592678000019613037",
    //   "subject": "Test Create by api 3",
    //   "dueDate": "2023-11-12T23:16:16.000Z",
    //   "description": "Hai This is Description for testing",
    //   "priority": "Medium",
    //   "classification": "Question",
    //   "phone": "233443",
    //   "email": "Ed+Test@attobahn.com",
    //   "status": "Open"
    // };
    let req_data = {
      create_tickets: true,
      department: selectedDepartment?.id,
      selectedAgent: selectedAgent?.id,
      cf_milestone_id: entityId,
      subject: data?.subject,
      description: data?.description,
      classification: data?.classification,
      priority: data?.priority,
      email: selectedContact
        ? selectedContact?.Email.toLowerCase()
        : vendor?.Contact_Email?.toLowerCase(),
      phone: selectedContact
        ? selectedContact?.Phone
        : vendor?.Contact_Telephone,
      // due_date: data?.due_date,
      // contactId: "592678000019613037",
    };
    console.log({ req_data });
    await ZOHO.CRM.FUNCTIONS.execute(func_name, req_data).then(async function (
      result
    ) {
      console.log(result);
      let resp = JSON.parse(
        result?.details?.output ? result?.details?.output : "{}"
      );
      if (resp?.id) {
        setTimeout(() => {
          handleCloseWidget();
        }, 5000);
      } else {
        if (resp?.error) {
          setSnackbarMessage(resp?.error);
          setOpenSnackbar(true);
        } else {
          setSnackbarMessage("Something went wrong please try again later...");
          setOpenSnackbar(true);
        }
        setCreateLoading(false);
      }
    });
    // Log form data to the console
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
          {/* <Box
        sx={{ display: "flex", gap: 5, justifyContent: "space-around", mb: 2 }}
      >
        <Typography>Created By: name of the user</Typography>
        <Typography>Date/Time: Not editable</Typography>
      </Box> */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
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
              {selectedDepartment?.id === "592678000020442029" && (
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
                        label="Customer/Vendor Contact Name"
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={6}>
                {" "}
                <Autocomplete
                  id="agent-autocomplete"
                  size="small"
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
                {" "}
                <Controller
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
