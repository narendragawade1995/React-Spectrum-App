import React, { useState, useEffect, useRef } from 'react'
import { Animated, FlatList, StyleSheet, TouchableWithoutFeedback, View, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card, Divider, Menu, Modal, Portal, Text } from 'react-native-paper'
import Icon from 'react-native-vector-icons/Ionicons'
import IconFontAwesome from 'react-native-vector-icons/FontAwesome'
import { COLORS } from '../theme/theme';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import IconManager from '../Utilities/IconManager';

const CardInfo = ({ info, navigation, togleinfoCard,secure }) => {
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
    const onDisposition = (item) => {
        togleinfoCard(!modelvisible)
        navigation.navigate('DispositionNew', item)
    }

    const onAccountdetails = (item) => {
        togleinfoCard(!modelvisible)
        navigation.navigate('AccDetails', item)
    }

    const onAccountdetails360 = (item) => {
        togleinfoCard(!modelvisible)
        navigation.navigate('Account360', item)
    };


    const futureComponent = (item) => {
        togleinfoCard(!modelvisible)
        navigation.navigate('FutuCom', item)
    };

    const onGestureEvent = (event) => {
        setModelvisibility(false)
        // setTimeout(() => togleinfoCard(false) ,3000);
    };
    const redirectTo = (route,item) =>{
        togleinfoCard(!modelvisible)
        navigation.navigate(route,item)
    }

    return (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>

            <Portal>

                <Modal onDismiss={onGestureEvent} contentContainerStyle={styles.modalContainer} visible={modelvisible}  >
                    {/*  */}

                    <View style={styles.modal}>
                        <Animated.View style={[styles.modalContent, { transform: [{ translateY: translateY }] }]} >
                            <Card mode='contained' style={{ backgroundColor: COLORS.primary, }}>
                              
                                    <Card.Title

                                        // title={info.account_no}
                                        titleStyle={{ fontWeight: '200', color: '#fff' ,paddingTop:20}}
                                        right={(props) => {
                                            return (
                                                <View style={{position:'relative',paddingTop:20}} >
                                                    <View style={{position:'absolute', top:-23,right:-2,zIndex:100}}>
                                                    <TouchableOpacity onPress={onGestureEvent} onLongPress={onGestureEvent}>
                                                    <IconManager iconClass="antdesign"  icon='closecircleo' color={COLORS.white}  size={25} />
                                                    </TouchableOpacity>
                                                    </View>
                                                    <Menu
                                                        contentStyle={{ margin: 10, borderRadius: 7 }}
                                                        visible={tooglemenu}
                                                        onDismiss={() => { onMenuOpen(!tooglemenu) }}

                                                        anchor={<Icon name="options-outline" size={30} style={{
                                                            color: '#fff', backgroundColor: COLORS.primary, marginRight: 0, transform: [{
                                                                rotate: tooglemenu ? '90deg' : '180deg'

                                                            }]
                                                        }} onPress={() => onMenuOpen(!tooglemenu)} />}
                                                    >

                                                        <Menu.Item onPress={() => onDisposition({...info,secure})} contentStyle={{ padding: 5 }} title="Disposition" />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Account Details" onPress={() => onAccountdetails({...info,secure})} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="360 View" onPress={() => onAccountdetails360({...info,secure})} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Contacts" onPress={() => redirectTo('Contacts',{...info,secure})} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Address" onPress={() => redirectTo('Address',{...info,secure})} />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Customer List" onPress={() => redirectTo('CustomerList',{...info,secure})} />
                                                        <Divider />
                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Liveliness" onPress={() => redirectTo('Liveliness',{...info,secure})} />

                                                        <Divider />
                                                        <Menu.Item contentStyle={{ padding: 5 }} title="Resolution Recommendation" onPress={() => redirectTo('Resolution',{...info,secure})} />
                                                        <Divider />

                                                    </Menu>
                                                </View>
                                            )
                                        }}

                                    />
                            </Card>
                            {/* <View style={{ borderRadius: 10, justifyContent:'flex-start',marginLeft:0 }}> */}
                            <FlatList showsVerticalScrollIndicator={false}
                                data={[1]}
                                renderItem={() => {
                                    return (<ScrollView  >
                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Account No </Text>
                                            <Text style={styles.valuecontent}>{info?.account_no}</Text>
                                        </Card.Content>
                                        <Divider />
                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}> Borrower Name </Text>
                                            <Text style={styles.valuecontent}>{info?.customer_name}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Virtual Number</Text>
                                            <Text style={styles.valuecontent}>{info?.virtual_number}</Text>
                                        </Card.Content>
                                        <Divider />
                                        <Divider />


                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Selling Bank </Text>
                                            <Text style={styles.valuecontent}>{info?.bank_name}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Trust </Text>
                                            <Text style={styles.valuecontent}>{info?.trust}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Resolution Status</Text>
                                            <Text style={styles.valuecontent}>{info?.resolution_status}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>EMI Overdue</Text>
                                            <Text style={styles.valuecontent}>{info?.over_dues}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>TOS as per normal ledger</Text>
                                            <Text style={styles.valuecontent}>{info?.over_dues}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>TOS as per Settlement/Restructuring</Text>
                                            <Text style={styles.valuecontent}>{info?.total_outstanding_settlement_restructure}</Text>
                                        </Card.Content>
                                        <Divider />
                                        <Divider />


                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Last Disposition</Text>
                                            <Text style={styles.valuecontent}>{info?.disposition}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Resolution Type</Text>
                                            <Text style={styles.valuecontent}>{info['resolution type']}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Last Action Date</Text>
                                            <Text style={styles.valuecontent}>{info?.last_disposition_date}</Text>
                                        </Card.Content>
                                        <Divider />

                                        <Card.Content style={styles.cardContent}>
                                            <Text style={styles.keycontent}>Follow Up Date</Text>
                                            <Text style={styles.valuecontent}>{info?.follow_up_date}</Text>
                                        </Card.Content>
                                    </ScrollView>)
                                }}
                            />
                        </Animated.View>
                    </View>
                    {/* </PanGestureHandler> */}
                </Modal>

            </Portal>
        </ScrollView>

    )
}

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
export default CardInfo