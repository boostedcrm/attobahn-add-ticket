import React, { useEffect, useState } from "react";
import "./App.css";
import {
  Button,
  Stack,
  MenuItem,
  TextField,
  Box,
  Typography,
} from "@mui/material"; // Correct import here
import { useForm, Controller } from "react-hook-form";
import Autocomplete from "@mui/material/Autocomplete";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

const ZOHO = window.ZOHO;

function App() {
  const { handleSubmit, control, formState } = useForm();
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
    console.log(selectedDepartment);
    console.log(selectedAgent);
    console.log(data);
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
      description: data?.inputText,
      classification: data?.classification,
      priority: data?.priority,
      contactId: "592678000019613037",
    };
    await ZOHO.CRM.FUNCTIONS.execute(func_name, req_data).then(async function (
      result
    ) {
      console.log(result);
      let resp = JSON.parse(result?.details?.output);
      if (resp?.id) {
        alert("Created Successfully");
      }
    });
    // Log form data to the console
  };

  const handleClose = async () => {
    ZOHO.CRM.UI.Popup.close().then(function (data) {});
  };

  const [selectedAgent, setSelectedAgent] = useState(null);

  // Filter agents based on the selected department
  const filteredAgents = selectedDepartment
    ? agents[selectedDepartment.id] || []
    : [];
  console.log({ selectedDepartment });
  return (
    <div className="App">
      <h1>Create a Ticket</h1>
      <Box
        sx={{ display: "flex", gap: 5, justifyContent: "space-around", mb: 2 }}
      >
        <Typography>Created By: name of the user</Typography>
        <Typography>Date/Time: Not editable</Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} width={500}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Autocomplete
              id="department-autocomplete"
              options={departments}
              getOptionLabel={(option) => option.nameInCustomerPortal}
              sx={{ width: "50%" }}
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
                />
              )}
            />

            <Autocomplete
              id="agent-autocomplete"
              options={filteredAgents}
              sx={{ width: "50%" }}
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
                />
              )}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Controller
              name="classification"
              control={control}
              defaultValue=""
              rules={{ required: true }}
              sx={{ width: "50%" }}
              render={({ field }) => (
                <TextField
                  select
                  label="Classification"
                  {...field}
                  sx={{ width: "50%" }}
                >
                  <MenuItem value="Problem/Issue">Problem/Issue</MenuItem>
                  <MenuItem value="Question">Question</MenuItem>
                  <MenuItem value="Feature">Feature</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="priority"
              control={control}
              defaultValue=""
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  select
                  label="Priority"
                  {...field}
                  align="center"
                  sx={{ width: "50%" }}
                >
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </TextField>
              )}
            />
          </Box>
          <Controller
            name="subject"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField label="Subject" type="text" {...field} />
            )}
          />
          <Controller
            name="inputText"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                type="text"
                label="Input text"
                multiline
                rows={3}
                {...field}
              />
            )}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DemoContainer components={["DateTimePicker"]}>
              <DateTimePicker label="Basic date time picker" />
            </DemoContainer>
          </LocalizationProvider>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!isValid}>
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </div>
  );
}

export default App;
