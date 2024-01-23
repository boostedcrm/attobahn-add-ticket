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
} from "@mui/material"; // Correct import here
import { useForm, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const ZOHO = window.ZOHO;

function App() {
  const { handleSubmit, control, formState } = useForm({
    defaultValues: {
      subject: "",
      description: "",
      classification: null,
      priority: null,
      due_date: null,
    },
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [entityId, setEntityId] = useState();
  const [agents, setAgents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { isValid } = formState;

  const [zohoLoaded, setZohoLoaded] = useState(false);

  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", function (data) {
      // console.log(data?.EntityId);
      setEntityId(data?.EntityId);
      //Custom Bussiness logic goes here
      // console.log(data);
    });
    /*
     * initializing the widget.
     */
    ZOHO.embeddedApp.init().then(() => {
      setZohoLoaded(true);
      ZOHO.CRM.UI.Resize({ height: "750", width: "700" }).then(function (data) {
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
        });
      }
    }
    getData();
  }, [zohoLoaded]);

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
      due_date: data?.due_date,
      contactId: "592678000019613037",
    };
    await ZOHO.CRM.FUNCTIONS.execute(func_name, req_data).then(async function (
      result
    ) {
      console.log(result);
      let resp = JSON.parse(
        result?.details?.output ? result?.details?.output : "{}"
      );
      if (resp?.id) {
        // setCreateLoading(false);
        // alert("Created Successfully");
        ZOHO.CRM.UI.Popup.closeReload().then(function (data) {
          console.log(data);
        });
      } else {
        setCreateLoading(false);
        alert("Something went wrong...!");
      }
    });
    // Log form data to the console
  };

  const [selectedAgent, setSelectedAgent] = useState(null);

  // Filter agents based on the selected department
  const filteredAgents = selectedDepartment
    ? agents[selectedDepartment.id] || []
    : [];
  // console.log({ selectedDepartment });
  return (
    <Box sx={{ m: 4 }}>
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
                  label="Select Agent"
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
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
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
                  minRows={3}
                  {...field}
                />
              )}
            />
          </Grid>
          <Grid item xs={6}>
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
          </Grid>
        </Grid>

        {/* <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={["DateTimePicker"]}>
            <DateTimePicker label="Basic date time picker" />
          </DemoContainer>
        </LocalizationProvider> */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="outlined"
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
            variant="contained"
            disabled={!isValid || createLoading}
          >
            {createLoading ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}

export default App;
