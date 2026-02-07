import React from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";

const FutureComp = ()=>{

    return (

        <View style={{flex:1,flexDirection:'row'}}>
           <Card mode="outlined" style={{margin:10,justifyContent:'center' ,width:'95%'}}>
            <Card.Title></Card.Title>
            <Card.Content><Text style={{fontWeight:'bold',fontSize:30,padding:30}}>Not Available...</Text></Card.Content>
           </Card>
        </View>
    );
}

export default FutureComp;