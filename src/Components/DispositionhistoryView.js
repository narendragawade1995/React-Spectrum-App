import React, { useEffect, useRef, useState } from "react";
import { Animated, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Divider, Modal, Portal, Text } from "react-native-paper";
import IconManager from "../Utilities/IconManager";
import { COLORS } from "../theme/theme";
const DispositionHistoryView = ({ info, navigation, togleinfoCard,secure })=>{
    const [modelvisible, setModelvisibility] = useState(info.openInfocard);
    const translateY = useRef(new Animated.Value(1000)).current;
    const [tooglemenu, setmenutoggel] = useState(false)
    useEffect(() => {
        if (modelvisible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            console.log(translateY, "===")
            Animated.timing(translateY, {
                toValue: 100, // Move off-screen
                duration: 400,
                useNativeDriver: true,
            }).start(() => togleinfoCard(false));

        }
    }, [modelvisible]);
    const onMenuOpen = (flag) => {
        setmenutoggel(flag)
    }
    
    const onGestureEvent = (event) => {
        setModelvisibility(false)
        // setTimeout(() => togleinfoCard(false) ,3000);
    };
    const redirectTo = (route,item) =>{
        togleinfoCard(!modelvisible)
        navigation.navigate(route,item)
    }

    const renderItems = ({item,index})=>{
        return (
            <ScrollView>
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Account No </Text>
                    <Text style={styles.valuecontent}>{info?.account_number}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Customer Name </Text>
                    <Text style={styles.valuecontent}>{info?.customer_name}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Virtual Number </Text>
                    <Text style={styles.valuecontent}>{info?.virtual_number}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Selling Bank </Text>
                    <Text style={styles.valuecontent}>{info?.selling_bank}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Trust Name </Text>
                    <Text style={styles.valuecontent}>{info?.trustname}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Sub Disposition </Text>
                    <Text style={styles.valuecontent}>{info?.sub_disposition}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Disposition </Text>
                    <Text style={styles.valuecontent}>{info?.disposition}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Type </Text>
                    <Text style={styles.valuecontent}>{info?.type}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Person Contacted </Text>
                    <Text style={styles.valuecontent}>{info?.person_contacted}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>No Contacted On </Text>
                    <Text style={styles.valuecontent}>{info?.no_contacted_on}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Default Reason </Text>
                    <Text style={styles.valuecontent}>{info?.default_reason}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Call Back Date </Text>
                    <Text style={styles.valuecontent}>{info?.call_back_date}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Source </Text>
                    <Text style={styles.valuecontent}>{info?.source}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Username </Text>
                    <Text style={styles.valuecontent}>{info?.username}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Disposition Date </Text>
                    <Text style={styles.valuecontent}>{info?.disposition_date}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Disposition Time </Text>
                    <Text style={styles.valuecontent}>{info?.disposition_time}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Remarks </Text>
                    <Text style={styles.valuecontent}>{info?.remarks}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Followup Date </Text>
                    <Text style={styles.valuecontent}>{info?.followup_date}</Text>
                  </Card.Content>
                  <Divider />
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Person Contacted Name </Text>
                    <Text style={styles.valuecontent}>{info?.person_contacted_name}</Text>
                  </Card.Content>
                  <Card.Content style={styles.cardContent}>
                    <Text style={styles.keycontent}>Src From </Text>
                    <Text style={styles.valuecontent}>{info?.src_from}</Text>
                  </Card.Content>
                  <Divider />
            </ScrollView>
        )
    }
    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            <Portal>
                <Modal onDismiss={onGestureEvent} contentContainerStyle={styles.modalContainer} visible={modelvisible}  >
                    <View style={styles.modal}>
                        <Animated.View style={[styles.modalContent, { transform: [{ translateY: translateY }] }]} >
                            <Card mode='contained' style={{ backgroundColor: COLORS.primary}}>
                                <Card.Title
                                     titleStyle={{ fontWeight: '200', color: '#fff' ,paddingTop:20}}
                                     right={(props)=>{
                                        return ( <View style={{position:'relative',paddingTop:20}} >
                                            <View style={{position:'absolute', top:-23,right:-2,zIndex:100}}>
                                            <TouchableOpacity onPress={onGestureEvent} onLongPress={onGestureEvent}>
                                                <IconManager iconClass="antdesign"  icon='closecircleo' color={COLORS.white}  size={25} />
                                            </TouchableOpacity>
                                            </View>
                                        </View>)
                                     }}  
                                />
                            </Card> 
                            <FlatList showsVerticalScrollIndicator={false}
                                data={[1]}
                                renderItem={renderItems}
                            />   
                        </Animated.View>    
                    </View>
                </Modal>    
            </Portal>
        </ScrollView>
    )
}

export default DispositionHistoryView;

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        margin: 0,
        // height:'100%',
        // backgroundColor: "green"

    },
    modal: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'flex-end',

    },
    modalContent: {
        height: '90%',
        // backgroundColor: 'white',
        // backgroundColor: '#03002f',
        backgroundColor: COLORS.primary,
        padding: 20,
        // borderRadius: 20
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },

    cardContent: {
        flexDirection: "row",
        padding: 3,
        // borderRadius:20,
        // backgroundColor:'#03002f',
        backgroundColor: COLORS.primary,
        justifyContent: "space-between",
        marginBottom: 5,
        marginTop: 5
    },
    keycontent: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        padding: 2,
        // color:'#D3D3D3',
        color: '#D3D3D3',
        // borderRadius:10,
        // alignContent:'center',
        // backgroundColor:'#03002f',
        backgroundColor: COLORS.primary,
        marginBottom: 5

    },
    valuecontent: {
        flex: 2,
        fontSize: 16,
        marginLeft: 15,
        fontWeight: "700",
        color: '#FFFFFF',
        //   backgroundColor:'#03002f',
        backgroundColor: COLORS.primary,

        padding: 2,
        // borderRadius:10,
        // alignContent:'center',
    },
})