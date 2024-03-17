import Cookies from 'js-cookie';
import React, { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { getBooks } from "./api/books/get-books";
import { Book } from "./api/books/types/book";
import groupBy from "lodash/groupBy";
import AddItem from "./components/modal/fragments/add-item";
import { deleteBooks } from "./api/books/delete-books";
import { Dictionary, set } from "lodash";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { toast } from 'react-toastify';

/** User APIs */
import { registerUser, loginUser } from './api/users';

/** MUI Comps */
import { Button, TextField, InputAdornment, IconButton, Select, MenuItem, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/** Utils */
import { foodItems } from './utility';

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function App() {

  /** Common */
  const [isLoading, setIsLoading] = useState(false);

  /** Register */
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  /** Login */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  /** User */
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');

  /** Calculator */
  const [foodItem, setFoodItem] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const user = Cookies.get('user');
    if (user) {
      const { email, token } = JSON.parse(user);
      setEmail(email);
      setSignedIn(true);
    }
  }, []);

  const handleRegister = async () => {
    setIsLoading(true);
    const resp = await registerUser(registerEmail, registerPassword);
    if (resp.id) {
      toast.success('User registered successfully');
    } else {
      toast.error('User registration failed');
    }
    setRegisterEmail('');
    setRegisterPassword('');
    setIsLoading(false);
  }

  const handleLogin = async () => {
    setIsLoading(true);
    const resp = await loginUser(loginEmail, loginPassword);
    const { email, token } = resp;
    if (email && token) {
      toast.success('User logged in successfully');
      Cookies.set('user', JSON.stringify({ email, token }));
      setSignedIn(true);
      setEmail(email);
      setToken(token);
    } else {
      toast.error('User login failed');
    }
    setLoginEmail('');
    setLoginPassword('');
    setIsLoading(false);
  }

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setSignedIn(true);
    setIsLoading(false);
  }

  const handleLogout = async () => {
    setIsLoading(true);
    setEmail('');
    setSignedIn(false);
    Cookies.remove('user');
    setFoodItem('');
    setItems([]);
    setIsLoading(false);
  }

  const addItemToList = () => {
    if(foodItem) setItems([...items, foodItem]);
    setFoodItem('');
  }

  const protein = items.reduce((acc, item) => acc + foodItems.find((food) => food.key === item).protein, 0);
  const carbs = items.reduce((acc, item) => acc + foodItems.find((food) => food.key === item).carbs, 0);
  const fat = items.reduce((acc, item) => acc + foodItems.find((food) => food.key === item).fat, 0);

  const saveCalculation = () => {
    if (!email) {
      toast.error('Please login to save calculation');
      return;
    }
    // Save calculation
  }

  if (isLoading) {
    return <div className="animate-spin h-5 w-5 text-white">.</div>;
  }

  if (!signedIn) {
    return (
      <div className='flex flex-col gap-4 border-2 p-6'>

        <h1 className='font-bold text-3xl text-center text-white'>Macro Nutrients Calculator App</h1>

        <div className='flex flex-row gap-4 p-4 '>

          {/* Register */}
          <div className="flex flex-col gap-2 bg-slate-100 p-4 rounded-md">
            <p className='text-center font-bold'>Register</p>
            <TextField
              required
              id="outlined-required"
              label="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <TextField
              label="Password"
              required
              type="password"
              value={registerPassword}
              onChange={(event) => setRegisterPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={handleRegister}>
              Register 
            </Button>
          </div>

          {/* Login */}
          <div className="flex flex-col gap-2 bg-slate-100 p-4 rounded-md">
            <p className='text-center font-bold'>Login</p>
            <TextField
              required
              id="outlined-required"
              label="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <TextField
              label="Password"
              required
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={handleLogin}>
              Login
            </Button>
          </div>
          
        </div>

        {/* Login as a guest */}
        <Button variant="contained" color="success" onClick={handleGuestLogin}>
          Login as a Guest
        </Button>

      </div>
      
    );
  }

  return (
    <div className="header-2 w-screen h-screen overflow-hidden">

      {/* Navbar */}
      <nav className="flex flex-row justify-between bg-slate-100 px-8 py-4">
        <div className="flex justify-between items-center">
          <p className='text-lg'>Hello <span className='font-bold text-2xl'>{email || 'Guest'}</span></p>
        </div>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Logout 
        </Button>
      </nav>

      {/* Calculator */}
      <div className="flex flex-col gap-2 p-4 items-center">

        <h1 className='font-bold text-3xl text-center text-white'>Macro Nutrients Calculator App</h1>

        <div className='flex flex-col gap-2 border-2 p-6 w-2/3'>
          <p className='text-lg text-center text-white'>Select Food Item</p>
          <Select
            id="item-select"
            value={foodItem}
            label="Select food item"
            onChange={(e) => setFoodItem(e.target.value)}
          >
            {foodItems.map((item, index) => (
              <MenuItem key={index} value={item.key}>{item.key}</MenuItem>
            ))}
          </Select>
          <Button variant="contained" color="success" onClick={addItemToList}>
            Add Item
          </Button>
        </div>

        {/* Selected Items */}
        {items.length > 0 && (
          <div className='flex flex-col gap-2 border-2 p-6 w-2/3'>
            <p className='text-lg text-center text-white'>Selected Items</p>
            <ul className='flex flex-row gap-2'>
              {items.map((item, index) => (
                <div className='flex flex-row gap-2 bg-slate-100 text-center px-4 py-2 rounded-lg'>
                  <li key={index}>{item}</li>
                  <CloseIcon color="error" onClick={() => setItems(items.filter((i) => i !== item))} />
                </div>
              ))}
            </ul>
          </div>
        )}

        {/* Macro Nutrients */}
        {items.length > 0 && (
          <div className='flex flex-row justify-center gap-2 border-2 p-6 w-2/3 bg-blue-300'>
            <Paper className='flex flex-col gap-2 p-4'>
              <p className='text-center text-black text-2xl'>Protein</p>
              <p className='text-center text-black text-4xl font-bold'>{protein}<span className='text-2xl'>g</span></p>
            </Paper>
            <Paper className='flex flex-col gap-2 p-4'>
              <p className='text-center text-black text-2xl'>Carbs</p>
              <p className='text-center text-black text-4xl font-bold'>{carbs}<span className='text-2xl'>g</span></p>
            </Paper>
            <Paper className='flex flex-col gap-2 p-4'>
              <p className='text-center text-black text-2xl'>Fat</p>
              <p className='text-center text-black text-4xl font-bold'>{fat}<span className='text-2xl'>g</span></p>
            </Paper>
          </div>
        )}

        {/* Save Calculation History */}
        <div className='flex flex-row justify-center gap-2 border-2 p-6 w-2/3'>
          <Button variant="contained" color="info" onClick={saveCalculation}>
            Save Calculation
          </Button>
        </div>

      </div>

    </div>
  );
}
