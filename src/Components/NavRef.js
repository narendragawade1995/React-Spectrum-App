import {CommonActions, createNavigationContainerRef} from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import { resetState } from '../Redux/Slicer/UserSlice';

export const navigationref = createNavigationContainerRef()

export function cusnavigate(name,params){
    if(navigationref.isReady()){
       try {
        console.log(navigationRef.current?.getRootState());
        navigationref.dispatch(CommonActions.reset({
            index:0,
            routes:[{name:'HomeDrawer',state:{routes:[{name:'Login'}]}}]
        }))
       } catch (error) {
        console.log(error)
       }
        // navigationref.navigate(name,params);
    }
}