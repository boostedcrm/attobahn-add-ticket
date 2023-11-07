import React, { useEffect, useState } from "react";
import "./App.css";
import { Button, Stack, MenuItem, TextField, Box, Typography } from "@mui/material"; // Correct import here
import { useForm, Controller } from "react-hook-form";
import Autocomplete from '@mui/material/Autocomplete';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

const ZOHO = window.ZOHO;

function App() {
  const { handleSubmit, control, formState } = useForm();
  const [departments, setDepartments] = useState([])
  const [agents, setAgents] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { isValid } = formState;

  const [zohoLoaded, setZohoLoaded] = useState(false);

  useEffect(() => {
    ZOHO.embeddedApp.on("PageLoad", function (data) {
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
  setDepartments(resp.departments)
  setAgents(resp.agents)

});
      }
    }
    getData();
  }, [zohoLoaded]);

  const onSubmit = (data) => {
    console.log(data); // Log form data to the console
  };

  const handleClose = async() => {
     await ZOHO.CRM.UI.Popup.close()
      .then(function(data){
          console.log(data)
      })
  }

  const [selectedAgent, setSelectedAgent] = useState(null);

  // Filter agents based on the selected department
  const filteredAgents = selectedDepartment
    ? agents[selectedDepartment.id] || []
    : [];
  console.log({selectedDepartment})
  return (
    <div className="App">
      <h1>Create a Ticket</h1>
      <Box sx={{display: "flex",gap: 5, justifyContent: "space-around",mb:2}}>
        <Typography>Created By: name of the user</Typography>
        <Typography>Date/Time: Not editable</Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2} width={500}>
          <Box sx={{display : "flex",gap: 1}}>

     <Autocomplete
        id="department-autocomplete"
        options={departments}
        getOptionLabel={(option) => option.nameInCustomerPortal}
        sx={{width: "50%"}}
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
        sx={{width: "50%"}}
        getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
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

<Box sx={{display: "flex", gap: 1}}>
<Controller
            name="classification"
            control={control}
            defaultValue=""
            rules={{ required: true }}
            sx={{width: "50%"}}
            render={({ field }) => (
              <TextField select label="Classification" {...field} sx={{width: "50%"}}>
                <MenuItem value="Problem">Problem/Issue</MenuItem>
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
              <TextField select label="Priority" {...field} align="center" sx={{width: "50%"}}>
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
      <DemoContainer components={['DateTimePicker']}>
        <DateTimePicker label="Basic date time picker" />
      </DemoContainer>
    </LocalizationProvider>
          <Box sx={{display: "flex", justifyContent: "flex-end", gap: 2}}>
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



const top100Films = [
  { label: 'The Shawshank Redemption', year: 1994 },
  { label: 'The Godfather', year: 1972 },
  { label: 'The Godfather: Part II', year: 1974 },
  { label: 'The Dark Knight', year: 2008 },
  { label: '12 Angry Men', year: 1957 },
  { label: "Schindler's List", year: 1993 },
  { label: 'Pulp Fiction', year: 1994 },
  {
    label: 'The Lord of the Rings: The Return of the King',
    year: 2003,
  },
  { label: 'The Good, the Bad and the Ugly', year: 1966 },
  { label: 'Fight Club', year: 1999 },
  {
    label: 'The Lord of the Rings: The Fellowship of the Ring',
    year: 2001,
  },
  {
    label: 'Star Wars: Episode V - The Empire Strikes Back',
    year: 1980,
  },
  { label: 'Forrest Gump', year: 1994 },
  { label: 'Inception', year: 2010 },
  {
    label: 'The Lord of the Rings: The Two Towers',
    year: 2002,
  },
  { label: "One Flew Over the Cuckoo's Nest", year: 1975 },
  { label: 'Goodfellas', year: 1990 },
  { label: 'The Matrix', year: 1999 },
  { label: 'Seven Samurai', year: 1954 },
  {
    label: 'Star Wars: Episode IV - A New Hope',
    year: 1977,
  },
  { label: 'City of God', year: 2002 },
  { label: 'Se7en', year: 1995 },
  { label: 'The Silence of the Lambs', year: 1991 },
  { label: "It's a Wonderful Life", year: 1946 },
  { label: 'Life Is Beautiful', year: 1997 },
  { label: 'The Usual Suspects', year: 1995 },
  { label: 'Léon: The Professional', year: 1994 },
  { label: 'Spirited Away', year: 2001 },
  { label: 'Saving Private Ryan', year: 1998 },
  { label: 'Once Upon a Time in the West', year: 1968 },
  { label: 'American History X', year: 1998 },
  { label: 'Interstellar', year: 2014 },
  { label: 'Casablanca', year: 1942 },
  { label: 'City Lights', year: 1931 },
  { label: 'Psycho', year: 1960 },
  { label: 'The Green Mile', year: 1999 },
  { label: 'The Intouchables', year: 2011 },
  { label: 'Modern Times', year: 1936 },
  { label: 'Raiders of the Lost Ark', year: 1981 },
  { label: 'Rear Window', year: 1954 },
  { label: 'The Pianist', year: 2002 },
  { label: 'The Departed', year: 2006 },
  { label: 'Terminator 2: Judgment Day', year: 1991 },
  { label: 'Back to the Future', year: 1985 },
  { label: 'Whiplash', year: 2014 },
  { label: 'Gladiator', year: 2000 },
  { label: 'Memento', year: 2000 },
  { label: 'The Prestige', year: 2006 },
  { label: 'The Lion King', year: 1994 },
  { label: 'Apocalypse Now', year: 1979 },
  { label: 'Alien', year: 1979 },
  { label: 'Sunset Boulevard', year: 1950 },
  {
    label: 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb',
    year: 1964,
  },
  { label: 'The Great Dictator', year: 1940 },
  { label: 'Cinema Paradiso', year: 1988 },
  { label: 'The Lives of Others', year: 2006 },
  { label: 'Grave of the Fireflies', year: 1988 },
  { label: 'Paths of Glory', year: 1957 },
  { label: 'Django Unchained', year: 2012 },
  { label: 'The Shining', year: 1980 },
  { label: 'WALL·E', year: 2008 },
  { label: 'American Beauty', year: 1999 },
  { label: 'The Dark Knight Rises', year: 2012 },
  { label: 'Princess Mononoke', year: 1997 },
  { label: 'Aliens', year: 1986 },
  { label: 'Oldboy', year: 2003 },
  { label: 'Once Upon a Time in America', year: 1984 },
  { label: 'Witness for the Prosecution', year: 1957 },
  { label: 'Das Boot', year: 1981 },
  { label: 'Citizen Kane', year: 1941 },
  { label: 'North by Northwest', year: 1959 },
  { label: 'Vertigo', year: 1958 },
  {
    label: 'Star Wars: Episode VI - Return of the Jedi',
    year: 1983,
  },
  { label: 'Reservoir Dogs', year: 1992 },
  { label: 'Braveheart', year: 1995 },
  { label: 'M', year: 1931 },
  { label: 'Requiem for a Dream', year: 2000 },
  { label: 'Amélie', year: 2001 },
  { label: 'A Clockwork Orange', year: 1971 },
  { label: 'Like Stars on Earth', year: 2007 },
  { label: 'Taxi Driver', year: 1976 },
  { label: 'Lawrence of Arabia', year: 1962 },
  { label: 'Double Indemnity', year: 1944 },
  {
    label: 'Eternal Sunshine of the Spotless Mind',
    year: 2004,
  },
  { label: 'Amadeus', year: 1984 },
  { label: 'To Kill a Mockingbird', year: 1962 },
  { label: 'Toy Story 3', year: 2010 },
  { label: 'Logan', year: 2017 },
  { label: 'Full Metal Jacket', year: 1987 },
  { label: 'Dangal', year: 2016 },
  { label: 'The Sting', year: 1973 },
  { label: '2001: A Space Odyssey', year: 1968 },
  { label: "Singin' in the Rain", year: 1952 },
  { label: 'Toy Story', year: 1995 },
  { label: 'Bicycle Thieves', year: 1948 },
  { label: 'The Kid', year: 1921 },
  { label: 'Inglourious Basterds', year: 2009 },
  { label: 'Snatch', year: 2000 },
  { label: '3 Idiots', year: 2009 },
  { label: 'Monty Python and the Holy Grail', year: 1975 },
];
