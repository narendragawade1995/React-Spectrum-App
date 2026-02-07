import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Modal, ScrollView } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Card, Text, Button } from "react-native-paper";
import { COLORS } from "../theme/theme";
import Api from "../Utilities/apiService";
import Loader from './Loader'; // Import your custom loader component
import AccountDetails from "./AccountDetails";
// import Pdf from 'react-native-pdf';

const Resolution = ({ route }) => {
    const [resolutionRecommendation, setResolutionRecommendation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [collateralData, setCollateralData] = useState([]);
    const [collateralLoading, setCollateralLoading] = useState(false);
    const [showcollateral, setShowcollateral] = useState(false);
    const [selectaccount, setSelectaccount] = useState(false);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);

    const route2 = {
        params:{

        }
    }

    useEffect(() => {
        const getResolutionRecommendation = async () => {
            try {
                const result = await Api.send(
                    { account_number: route.params.account_no },
                    'diposition/borrowerClassification'
                );
                setResolutionRecommendation(result);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };
        getResolutionRecommendation();
    }, [route.params.account_no]);

    const handleCollateralView = async (loanAccountNo) => {
        // setCollateralLoading(true);
        setSelectaccount(loanAccountNo)
        try {
            // const data = await Api.get(`securedloanview/getSecuredLoanViewDetails?LoanAccountNo=${loanAccountNo}&ViewType=Collateral View`);
            // setCollateralData(data.SecuredLoanViewData);
            // setModalVisible(true);
            setShowcollateral(!showcollateral);
        } catch (error) {
            console.error("Error fetching collateral data:", error);
        } finally {
            setCollateralLoading(false);
        }
    };
    const handleFAQClick = () => {
        setPdfModalVisible(true);
    };
    const renderRecommendationItem = ({ item }) => (
        <Card style={styles.card}>
            <CardContent label="CIF" value={item?.cif} />
            <CardContent label="Borrower Name" value={item?.name_of_borrower} />
            <CardContent label="Cibil Score" value={item?.cibil_score} />
            <CardContent label="Borrower's Categorization" value={item?.borrower_classification} />
            <CardContent label="Resolution Recommendation Plan" value={item?.resolution_strategy} />
            <CardContent label="Collateral View">
                <TouchableOpacity onPress={() => handleCollateralView(item.loan_account_number)}>
                    <Text style={styles.valueText}>Click Here</Text>
                </TouchableOpacity>
            </CardContent>
            {/* <CardContent label="FAQ">
                <TouchableOpacity onPress={handleFAQClick}>
                    <Text style={styles.valueText}>Click Here</Text>
                </TouchableOpacity>
            </CardContent> */}
        </Card>
    );

    return (
        <ScrollView style={styles.mainContainer}>
            {loading ? (
                <Loader />
            ) : (
                resolutionRecommendation.length > 0 ? (
                    <FlatList
                        data={resolutionRecommendation}
                        // horizontal={true}
                        renderItem={renderRecommendationItem}
                        keyExtractor={(item, index) => index.toString()}
                    />
                ) : (
                    <View style={styles.workin}>
                        <Text style={styles.emptyMessage}>Work In Progress</Text>
                    </View>
                )
            )}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error fetching data: {error.message}</Text>
                </View>
            )}
            <CollateralModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                collaterals={collateralData}
                loading={collateralLoading}
            />
             {/* <PdfModal
                visible={pdfModalVisible}
                onClose={() => setPdfModalVisible(false)}
                source={{ uri: 'https://uatarcretailreports.edelweissarc.in/assets/Resolution_recommedation.pdf', cache: true }}
            /> */}
            { showcollateral && <AccountDetails route={route2} loanAccountNo={selectaccount} fromresolution={true}/> }
        </ScrollView>
    );
};

const CardContent = ({ label, value, children }) => (
    <Card.Content style={styles.cardContent}>
        <Text style={styles.labelText}>{label}</Text>
        {children ? children : <Text style={styles.valueText}>{value || 'N/A'}</Text>}
    </Card.Content>
);

const CollateralModal = ({ visible, onClose, collaterals, loading }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Collateral Details</Text>
                {loading ? (
                    <Loader />
                ) : (
                    <ScrollView >
                        {collaterals.map((collateral, index) => (
                            <View key={index} style={styles.collateralCard}>
                                <ModalContent label="Asset Codes" value={collateral["Asset Codes"]} />
                                <ModalContent label="Account No" value={collateral["Account No"]} />
                                <ModalContent label="Customer Name" value={collateral["Customer Name"]} />
                                <ModalContent label="Collateral Address" value={collateral["Collateral Address"]} />
                                <ModalContent label="Collateral State" value={collateral["Collateral State"]} />
                                <ModalContent label="Collateral City" value={collateral["Collateral City"]} />
                                <ModalContent label="Collateral PIN" value={collateral["Collateral PIN"]} />
                                <ModalContent label="FMV" value={collateral["FMV"]} />
                                <ModalContent label="RSV" value={collateral["RSV"]} />
                                <ModalContent label="DSV" value={collateral["DSV"]} />
                                <ModalContent label="Valuation Date" value={collateral["Valuation Date"]} />
                                <ModalContent label="SV Valuation Amount" value={collateral["SV Valuation Amount"]} />
                                <ModalContent label="SV Valuation Date" value={collateral["SV Valuation Date"]} />
                                <ModalContent label="Address Source" value={collateral["Address Source"]} />
                            </View>
                        ))}
                    </ScrollView>
                )}
                <Button onPress={onClose}>Close</Button>
            </View>
        </View>
    </Modal>
);

const ModalContent = ({ label, value }) => (
    <View style={styles.modalContentRow}>
        <Text style={styles.modalLabelText}>{label}</Text>
        <Text style={styles.modalValueText}>{value || 'N/A'}</Text>
    </View>
);

// const PdfModal = ({ visible, onClose, source }) => (
//     <Modal visible={visible} transparent={true} animationType="slide">
//         <View style={styles.modalContainer}>
//             <View style={styles.pdfContent}>
//                 <Pdf
//                     source={source}
//                     onLoadComplete={(numberOfPages, filePath) => {
//                         console.log(`Number of pages: ${numberOfPages}`);
//                     }}
//                     onPageChanged={(page, numberOfPages) => {
//                         console.log(`Current page: ${page}`);
//                     }}
//                     onError={(error) => {
//                         console.log(error);
//                     }}
//                     style={styles.pdf}
//                 />
//                 <Button onPress={onClose}>Close</Button>
//             </View>
//         </View>
//     </Modal>
// );

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.bg_primary,
        padding: 12,
    },
    card: {
        marginBottom: 15,
        borderRadius: 10,
        elevation: 3,
        backgroundColor: COLORS.white,
    },
    cardContent: {
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 10,
    },
    labelText: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '600',
        paddingBottom: 10,
    },
    valueText: {
        fontSize: 14,
        color: '#333333',
        fontWeight: 'bold',
        paddingLeft: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    emptyMessage: {
        fontSize: 16,
        textAlign: 'center',
        color: COLORS.white
    },
    workin: {
        padding: 10,
        backgroundColor: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalContentRow: {
        
        marginBottom: 10,
    },
    modalLabelText: {
        fontSize: 12,
            color: '#666666',
    },
    modalValueText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
    },
    collateralContainer: {
        marginBottom: 20,
    },
    pdfContent: {
        width: '90%',
        height: '80%',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 10,
    },
    collateralCard: {
        // width: 250,
        // marginHorizontal: 10,
        // borderRadius: 10,
        // padding: 15,
        // backgroundColor: COLORS.white,
        // elevation: 3,
    },
    pdf: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});

export default Resolution;
