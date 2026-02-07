import React, { useEffect, useState } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { Card, Divider, Text, Button } from "react-native-paper";
import Loader from "./Loader";
import Api from "../Utilities/apiService";
import { COLORS } from "../theme/theme";
import { useNavigation } from "@react-navigation/native";

const ContactDetails = ({ route }) => {
    const [contactData, setContactData] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const accountId = route.params.account_id;

    useEffect(() => {
        fetchContactDetails();
    }, []);

    const fetchContactDetails = async () => {
        try {
            const result = await Api.get(`diposition/phonenumber?account_id=${accountId}`);
            setContactData(result);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = () => {
        navigation.navigate("AddContact", { account_id: accountId });
    };

    if (loading) {
        return <Loader />;
    }

    const renderContactCard = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                {renderCardItem("Name", item.customer_name)}
                {renderCardItem("Applicant Type", item.brw_type)}
                {renderCardItem("Contact Type", item.cont_type)}
                {renderCardItem("Contact Number", item.cont_number)}
                {renderCardItem("Source", item.source,true)}
            </View>
        </Card>
    );

    const renderCardItem = (label, value,last) => (
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
            <View style={{paddingTop:30}}>
            <FlatList
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                data={contactData}
                keyExtractor={(item, index) => `contact-${index}`}
                renderItem={renderContactCard}
            />
            </View>
            <Button mode="contained" onPress={handleAddContact} style={styles.addButton}>
                Add Contact
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

export default ContactDetails;
