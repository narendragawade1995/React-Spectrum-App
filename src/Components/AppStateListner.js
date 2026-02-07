import React, { useEffect } from "react"
import {AppState} from 'react-native'
const AppStateListner = ()=>{
       
    useEffect(()=>{
        const appstatesubs = AppState.addEventListener('change',handdleAppstate);
        return ()=>{
            appstatesubs.remove();
        }
    },[])

    const handdleAppstate = (nextstep)=>{
        console.log("curretn app state is ",nextstep);
    }
}

export default AppStateListner;