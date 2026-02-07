import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Api from "../Utilities/apiService";
import { Card ,Text} from "react-native-paper";
import { COLORS } from "../theme/theme";

const CustomerList = ({route,...props})=>{

    const [customerlist,setCustomerlist] = useState([]);

    const getCustomerList = async()=>{
        try {
            let result =  await Api.send(route.params,'secure_borrowerdetails/getcustomerList');
            console.log(result);
            setCustomerlist(result);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(()=>{
        getCustomerList()
    },[]);

    return (
        <View style={styles.maincontainer}>
            <FlatList
                data={customerlist}
                renderItem={({ item, index })=>{
                    return (
                        
                        <Card style={styles.card}>
                            <Card.Content style={styles.card_contain}>
                                <Text style={styles.labelText}>Customer Name</Text>
                                <Text style={styles.valueText}>{item['Customer Name']}</Text>
                            </Card.Content>
                            <Card.Content style={styles.card_contain}>
                                <Text style={styles.labelText}>Account Number</Text>
                                <Text style={styles.valueText}>{item?.lan}</Text>
                            </Card.Content>
                            <Card.Content style={styles.card_contain}>
                                <Text style={styles.labelText}>Applicant Type</Text>
                                <Text style={styles.valueText}>{item['Borrower Type']}</Text>
                            </Card.Content>
                        </Card>
                    )
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    maincontainer: {
      flex: 1,
      backgroundColor:  COLORS.bg_primary,
      padding: 12,
    },
    card: {
      marginBottom: 15,
      borderRadius: 10,
      elevation: 3,
      backgroundColor:    COLORS.white
    },
    card_contain: {
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      paddingBottom: 10
    },
    labelText: {
      fontSize: 12,
      color: '#666666',
      fontWeight: '600',
      paddingBottom:10
    },
    valueText: {
      fontSize: 14,
      color: '#333333',
      fontWeight: 'bold',
      paddingLeft:10
    },
  });
export default CustomerList