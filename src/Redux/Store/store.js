import { configureStore } from "@reduxjs/toolkit";
import UserReducer from '../Slicer/UserSlice'

const Store = configureStore({
    reducer:{
        USER:UserReducer
    }
})

export default Store;