import React, {  useCallback, useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Card, Divider, Text, Button } from "react-native-paper";
import Loader from "./Loader";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import { useNavigation } from "@react-navigation/native";

const AddressDetails = ({ route }) => {
    const [address, setAddress] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const accountId = route.params.account_id;

    useEffect(() => {
        fetchAddressDetails();
    }, []);

    const fetchAddressDetails = async () => {
        try {
            const result = await Api.get(`diposition/addressDetails?account_id=${accountId}`);
            setAddress(result);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = () => {
        navigation.navigate("AddAddress", { account_id: accountId });
    };

    if (loading) {
        return <Loader />;
    }

    const renderAddressCard = ({ item }) => (
        <Card style={styles.card}>
            {renderCardItem("Name", item.customer_name)}
            {renderCardItem("Applicant Type", item.brw_type)}
            {renderCardItem("Address Type", item.address_type)}
            {renderCardItem("Address 1", item.address1)}
            {renderCardItem("Address 2", item.address2)}
            {renderCardItem("Address 3", item.address3)}
            {renderCardItem("City", item.city)}
            {renderCardItem("State", item.state)}
            {renderCardItem("Pincode", item.pin_code)}
            {renderCardItem("Source", item.source, true)}
        </Card>
    );

    const renderCardItem = (label, value, last) => (
        <>
            <Card.Content>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || '-'}</Text>
            </Card.Content>
            {!last && <Divider />}
        </>
    );

    return (
        <View style={styles.container}>
            <View>
            <FlatList
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                data={address}
                keyExtractor={(item, index) => `address-${index}`}
                renderItem={renderAddressCard}
            />
            </View>
            <Button mode="contained" onPress={handleAddAddress} style={styles.addButton}>
                Add Address
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: COLORS.bg_primary,
        padding: 10,
    },
    card: {
        margin: 10,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        elevation: 2,
        width: 300,
    },
    label: {
        fontSize: 12,
        color: COLORS.grey,
        paddingBottom: 5,
        paddingTop: 7,
        paddingLeft: 5,
    },
    value: {
        fontSize: 14,
        color: COLORS.black,
        paddingBottom: 10,
        paddingLeft: 12,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        marginTop: 20,
    },
});

export default AddressDetails;
