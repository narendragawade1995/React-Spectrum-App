import { useEffect, useState } from "react"
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native'
import { Card, IconButton, Menu,Searchbar,Text} from 'react-native-paper'
import Api from "../Utilities/apiService"
import Icon from 'react-native-vector-icons/Ionicons'
import { COLORS } from "../theme/theme"

const Home = ({ navigation }) => {
     
    const [toggleMenu,setToggleMenu] = useState({});
    const [securedata,setSecuredata] = useState([]);
    const [tempsecuredata,settempSecuredata] = useState([]);
    getdata = async () => {
        try {
            let result = await Api.send({
                "pageIndex": 0,
                "pageSize": 20,
                "isfromCovex": false
            }, 'secure_borrowerdetails/secure_borrowerdetailsData');
            setSecuredata(result.ArrayOfResponse)
            settempSecuredata(result.ArrayOfResponse)
        } catch (error) {
            console.log("the error is")
            console.log(error)
        }

    }
    useEffect(()=>{
        getdata()
        
    },[])
    onMenuopen = (index)=>{
        setToggleMenu(prv=>({
            ...prv,
            [index]:!prv[index]
        }))
    }

    onMenuclose = ()=>{setToggleMenu(false)}
    
    const onDisposition = (item,index) =>{
        onMenuopen(index)
        navigation.navigate('Disposition',item)
    }
    
    const onsearch = (str)=>{
       
        if(str.length > 2){
            
        let updateddata = securedata.filter(itm=>{
            return itm.account_no.includes(str)
        })

        setSecuredata(updateddata)
        }
        else{
            setSecuredata(tempsecuredata)
        }
    }

    

    return (
        <ScrollView style={styles.container}>
            <View style={styles.filters}>
              
                  <Searchbar
                    placeholder='Serach Account No'
                    onChangeText={onsearch}
                    icon={()=><Icon name="filter-sharp" size={30} color="#000" />}
                    style={styles.serachbar}
                   />
               
            </View>
            {securedata.map((itm, index) => {
                return <Card mode="outlined" style={styles.maincard} key={index}>
                       <Card.Title
                        title={`Account No : ${itm.account_no}`}
                        titleStyle={{fontWeight:'bold'}}
                        right={(props)=>{
                            return <Menu
                            key={index}
                            visible={toggleMenu[index]}
                            onDismiss={()=>{onMenuopen(index)}}
                            anchor={<IconButton  icon="dots-vertical" style={{ marginRight: 0}}  onPress={()=>{onMenuopen(index)}}/>}    
                       >
                            <Menu.Item title="Disposition" onPress={()=>{onDisposition(itm,index)}}/>
                            {/* <Menu.Item title="open"/> */}
                        </Menu>
                        }}
                       />
                       
                        {/* <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Account No </Text>
                            <Text style={styles.valuecontent}>{itm.account_no}</Text>
                        </Card.Content> */}
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Virtual Number</Text>
                            <Text style={styles.valuecontent}>{itm.virtual_number}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Selling Bank </Text>
                            <Text style={styles.valuecontent}>{itm.bank_name}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Trust </Text>
                            <Text style={styles.valuecontent}>{itm.trust}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Resolution Status</Text>
                            <Text style={styles.valuecontent}>{itm.resolution_status}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Emi Overdue</Text>
                            <Text style={styles.valuecontent}>{itm.over_dues}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>TOS as per normal ledger</Text>
                            <Text style={styles.valuecontent}>{itm.over_dues}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>TOS as per settlement/Restructuring</Text>
                            <Text style={styles.valuecontent}>{itm.total_outstanding_settlement_restructure}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>TOS as per</Text>
                            <Text style={styles.valuecontent}>{itm.total_outstanding_settlement_restructure}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Last Disposition</Text>
                            <Text style={styles.valuecontent}>{itm.last_disposition_date}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Resolution Type</Text>
                            <Text style={styles.valuecontent}>{itm['resolution type']}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Last Action Date</Text>
                            <Text style={styles.valuecontent}>{itm.last_disposition_date}</Text>
                        </Card.Content>
                        <Card.Content style={styles.cardcontent}>
                            <Text  style={styles.keycontent}>Follow up date</Text>
                            <Text style={styles.valuecontent}>{itm.last_disposition_date}</Text>
                        </Card.Content>
                      
                      
                </Card>
            })}
        </ScrollView>
    )
   
}

export default Home


const styles = StyleSheet.create({
    container: {
        // flex: 2,
        // padding: 10,
        // backgroundColor: "#03002f",
        
        backgroundColor:COLORS.primary
        
    },
    maincard:{
        margin:3,
        marginBottom:10,
        borderRadius:8,
        backgroundColor:"#ffffff"
    },
    cardcontent:{
        flexDirection:"row",
        padding:3,
        justifyContent:"space-between"
    },
    keycontent:{
        flex:1,
        fontSize:15,
        fontWeight:"bold",
        // padding:3
    },
    cardheader:{
        flexDirection:'row',
        justifyContent:'flex-end',
        paddingRight:3
    },
    menubutton:{
        marginTop:-5
    },
    valuecontent:{
        flex:2,
        fontSize: 15,
        marginLeft: 15,
        // padding:3
    },
    menucontent:{
        position: 'absolute',
        top: 20,
        right: 0,
        zIndex: 100, 
        // marginTop: 40, 
        // zIndex: 1, 
    },
    filters:{
        // flex:1,
        // flexDirection:'row'
    },
    serachbar:{
        borderRadius:13,
        margin:5
    }
   
        
    

})