import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card,Searchbar, Text } from "react-native-paper";
import SkeletonLoader from "./SkeletonLoader ";
import { COLORS } from "../theme/theme";
import Api from "../Utilities/apiService";
import IconManager from "../Utilities/IconManager";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DispositionHistoryView from "./DispositionhistoryView";
import commonfun from "../Utilities/CommonFun";
const DispositionHistory = ({navigation,...props}) =>{
    const [loader, setLoader] = useState(true);
    const [dishistory,setdishistory] = useState([]);
    const [filterPanelVisible, setFilterPanelVisible] = useState(false);
    const [filterPosition, setFilterPosition] = useState(Dimensions.get('window').width);
    const [openInfocard, setInfoCard] = useState(false)
    const [currentItem, setCurrentItem] = useState({});
    useEffect(()=>{
        dispositionhis()
    },[])
   

    const dispositionhis = async()=>{
        let result  = await Api.send({
            "pageIndex": 0,
            "pageSize": 20,
            "sortcolumn": "id",
            "type": "Field Visit",
            "totalRecords": 0,
            "convoxfrom": false
        },'diposition/getdisposition');
        
        setdishistory(result['ArrayOfResponse'] ? result['ArrayOfResponse']:[]);
        setLoader(false);
    }
    const handleSearch = (text)=>{

    }
    const handleClear =(text)=>{

    }
    const toggleFilterPanel = useCallback(() => {
        setFilterPanelVisible(!filterPanelVisible);
        setFilterPosition(filterPanelVisible ? Dimensions.get('window').width : 0);
    }, [filterPanelVisible]);
    
    const togleinfoCard = (flag, item = {}) => {
        setInfoCard(flag)
        if (Object.keys(item).length > 0) {
            setCurrentItem(item)
            
        }
    }
    const renderItems = ({item,index})=>{
        return (
            <View style={{ backgroundColor: COLORS.bg }}>
                  <Card style={styles.card}>
                    <TouchableOpacity style={{ marginTop: 25, borderRadius: 10 }}
                        onPress={()=>togleinfoCard(true,item)}>
                        <Card.Content style={{ padding: 0, margin: 0 }}>
                            <View style={styles.row}>
                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                    <View style={styles.iconCircle}>
                                        <Icon name="card-account-details" size={15} style={styles.icon} />
                                    </View>

                                    <View>
                                        <View>
                                            <Text style={styles.label}>Account Number</Text>
                                            <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{item.account_number}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View>
                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%', paddingRight: 10 }}>
                                    <View style={styles.iconCircle}>
                                        <Icon name="account-outline" size={15} style={styles.icon} />
                                    </View>
                                    <View>
                                        <View style={{ display: 'flex' }}>
                                            <Text style={styles.label}>Borrower Name</Text>
                                            <Text style={{ ...styles.value, marginTop: 5, flexWrap: 'wrap' }}>{item.customer_name} </Text>
                                        </View>
                                    </View>
                                </View>
                                </View>
                            </View>
                            <View style={{ ...styles.row, marginTop: 20 }}>
                  
                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                    <View style={styles.iconCircle}>
                                        <Icon name="message-text-outline" size={15} style={styles.icon} />
                                    </View>

                                    <View>
                                        <View>
                                            <Text style={styles.label}>Disposition</Text>
                                            <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{item.disposition}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                    <View style={styles.iconCircle}>
                                       <IconManager iconClass='antdesign' icon="calendar" size={15} color={COLORS.bg} />
                                    </View>

                                    <View>
                                        <View>
                                            <Text style={styles.label}>Disposition Date</Text>
                                            <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{commonfun.formatDate(item.disposition_date)}</Text>
                                        </View>
                                    </View>
                                </View>

                            </View>
                            <View style={{ ...styles.row, marginTop: 20 }}>
                  
                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                    <View style={styles.iconCircle}>
                                    <IconManager iconClass='ionicon' icon="time-outline" size={15} color={COLORS.bg}/>
                                    </View>

                                    <View>
                                        <View>
                                            <Text style={styles.label}>Disposition Time</Text>
                                            <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{item.activity_time}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{ display: 'flex', flexDirection: 'row', flexBasis: '50%' }}>
                                    <View style={styles.iconCircle}>
                                        <IconManager iconClass='materialicon' icon="person" size={15} color={COLORS.bg} />
                                    </View>

                                    <View>
                                        <View>
                                            <Text style={styles.label}>UserName</Text>
                                            <Text style={{ ...styles.value, marginTop: 5, fontSize: 11 }}>{item.username}</Text>
                                        </View>
                                    </View>
                                </View>

                            </View>
                        </Card.Content>    

                    </TouchableOpacity>
                  </Card>
            </View>
        )
    }

    if(loader){
        return (
            <View style={styles.skeleton}>
                <SkeletonLoader/>
                <SkeletonLoader />
                <SkeletonLoader />
            </View>
        )
    }
    return (
        <View style={styles.container}>
            <View style={styles.filters}>
            <View>
                    <Searchbar
                        placeholder='Search Account No.'
                        value={''}
                        iconColor={COLORS.primary}
                        rippleColor={COLORS.primary}
                        onChangeText={handleSearch}
                        onClearIconPress={handleClear}
                        style={styles.serachbar}
                        right = {()=>(
                            <TouchableOpacity style={styles.filterButton} onPress={toggleFilterPanel}>
                                <IconManager iconClass='ionicon' icon="options" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        )}
                    />
       
            </View>
            </View>
            <View style={{ marginBottom: 100 }}>
                <FlatList
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={()=><View style={{height:1}}/>}
                    keyExtractor={(item,index)=>index}
                    data={dishistory}
                    renderItem={renderItems}
                />
            </View>
            {
                openInfocard && <View><DispositionHistoryView navigation={navigation} info={{ ...currentItem, openInfocard }} togleinfoCard={togleinfoCard} /></View>
            }
        </View>    
    )
}


export default DispositionHistory;

const styles = StyleSheet.create({
    skeleton: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    container: {
        // padding: 10,
        height: '100%',
        // backgroundColor: "#03002f",
        backgroundColor: COLORS.bg,
        marginBottom: 20,
    },
    filters: {
        // flex:1,
        // flexDirection:'row'
        padding: 10,
        position: 'relative'
    },
    card: {
        margin: 10,
        borderRadius: 8,
        elevation: 3,
        // backgroundColor: '#F2F2F2',
        backgroundColor: COLORS.white,
        padding: 15,
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    icon: {
        color: COLORS.white,
    },
    label: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: 'bold',
        flex: 1,
    },
    value: {
        fontSize: 10,
        color: COLORS.primary,
    },
    iconCircle: {
        // backgroundColor: '#895FA5', // Define this color in your constants
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        padding: 7,
        marginRight: 10,
        height: 30,
        width: 30,
        alignItems: 'center'
    },
    serachbar:{
        borderRadius: 13,
        margin: 5,
        backgroundColor: COLORS.white,
        color:COLORS.primary
    },
    filterButton: {
        marginLeft: 10,
        padding: 10,
        borderRadius: 20,
        // backgroundColor: '#e0e0e0', // Light background for the button
        justifyContent: 'center',
        alignItems: 'center',
        // elevation: 2, // Add shadow for a raised effect
      },
})