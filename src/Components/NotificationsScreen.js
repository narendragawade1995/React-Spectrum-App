import { StyleSheet, Text, View } from "react-native"


const Notification = ({navigation,...props}) =>{
    
    return <View style={styles.container}>
        <Text>Notification Screen</Text>
    </View>
}

export default Notification

const styles = StyleSheet.create({
    container :{
        flex:1,
        alignItems:'center',
        justifyContent:'center',
        backgroundColor:'#fff'
    }
})