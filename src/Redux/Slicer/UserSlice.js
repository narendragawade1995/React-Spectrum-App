import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSlice } from "@reduxjs/toolkit";
import unionBy from 'lodash/unionBy'

const initialState ={
    modetype:null,
    userInfo:{
        userDetails:[],
    },
    secure:{
        borrowerdetails:[],
        filterborrowerlist:[],
        dispositionlist:[],
        trustcodelist:[],
        sellingbanklist:[],
        zonelist:[],
        addedfilter:{}
    }
}

console.log({initialState:JSON.stringify(initialState)})
const UserSlice = createSlice({
    name:'logedInuser',
    initialState:initialState,
    reducers:{
        resetState:(state,action)=>{
            
            console.log("reset call",initialState)
            return initialState
        },
        setUser : (state,action)=>{
            AsyncStorage.setItem('userdetail',JSON.stringify(action.payload))
            .then(()=>{}).catch(err=>err)
            AsyncStorage.setItem('authtoken',action.payload.token)
            .then(()=>{}).catch(err=>err)
            AsyncStorage.getItem('modeType').then(mode=>{
                
                if(mode == null){
                    AsyncStorage.setItem('modeType','online').then(res=>{
                        state.modetype = 'online';
                    }).catch(err=>{})
                }else{
                    state.modetype = mode;
                    console.log("====",state)
                }
            }).catch(err=>{})
            state.userInfo = action.payload
        },
        getUser : (state)=>{
            return state
        },
        setSecure:(state,action)=>{
            state.secure.borrowerdetails = [...action.payload];
            state.secure.dispositionlist = unionBy(state.secure.borrowerdetails.map(itm=>{ return {label:itm.disposition,value:itm.disposition}}),'value')
            state.secure.trustcodelist = unionBy(state.secure.borrowerdetails.map(itm=>{return {label:itm.trust,value:itm.trust}}),'value')
            state.secure.sellingbanklist = unionBy(state.secure.borrowerdetails.map(itm=>{return {label:itm.bank_name,value:itm.bank_name}}),'value')
            state.secure.zonelist = unionBy(state.secure.borrowerdetails.map(itm=>{return {label:itm.zone,value:itm.zone}}),'value')
        },
        setSecureFilter:(state,action)=>{
            state.secure.filterborrowerlist = action.payload
        },
        addFilters:(state,action)=>{
            state.secure.addedfilter = action.payload;
        },
        logout:(state)=>{
            return state.userInfo = {}
        }
    },
});

export const {setUser,getUser,logout,setSecure,setSecureFilter,addFilters,resetState} = UserSlice.actions

export default UserSlice.reducer