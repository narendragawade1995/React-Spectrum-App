import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Card } from "react-native-paper";
import Loader from "./Loader";
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthComponent = ({ navigation }) => {

    const [loader, setLoader] = useState(true);
    useEffect(() => {
        navigate();
    }, [])
    const navigate = async() => {
        const token = await AsyncStorage.getItem('authtoken');
        console.log(token);
        if(token){
            setLoader(false);
            navigatetoComponent('Home');
            return;
             
        } 
        setLoader(false);
        navigatetoComponent('Login')
        
    };

    
    const navigatetoComponent = (path) =>{
     navigation.navigate(path);
    }
    return (
        <View  >
            {loader && <Loader />}
        </View>
    );
};

export default AuthComponent;