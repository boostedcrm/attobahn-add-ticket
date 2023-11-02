import React from "react";
import "./App.css";
import { Button, Stack, MenuItem, TextField, Box } from "@mui/material"; // Correct import here
import { useForm, Controller } from "react-hook-form";
import AutoComplete from "./AutoComplete";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

function App() {
  const { handleSubmit, control, formState } = useForm();
  const { isValid } = formState;

  const onSubmit = (data) => {
    console.log(data); // Log form data to the console
  };

  return (
    <div className="App">
      <h1>Create a Ticket</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} width={500}>
          {/* <Controller
            name="contactName"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                label='Contact Name'
                type='text'
                {...field}
              />
            )}
          /> */}

          {/* <Controller
            name="email"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                label='Email'
                type='email'
                {...field}
              />
            )}
          /> */}

          <Controller
            name="department"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField select label="Department" {...field}>
                <MenuItem value="Accounting">Accounting</MenuItem>
                <MenuItem value="Compliance">Compliance</MenuItem>
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="classification"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField select label="Classification" {...field}>
<MenuItem value="Question">Question</MenuItem>
<MenuItem value="Problem">Problem</MenuItem>
<MenuItem value="Feature">Feature</MenuItem>
<MenuItem value="Others">Others</MenuItem>
              </TextField>
            )}
          />

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

          <Controller
            name="priority"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            render={({ field }) => (
              <TextField select label="Priority" {...field}>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            )}
          />
             <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={['DateTimePicker']}>
        <DateTimePicker label="Basic date time picker" />
      </DemoContainer>
    </LocalizationProvider>
          <Box sx={{display: "flex", justifyContent: "flex-end", gap: 2}}>
          <Button variant="outlined">
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
