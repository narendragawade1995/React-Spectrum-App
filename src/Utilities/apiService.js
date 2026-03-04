import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cusnavigate } from '../Components/NavRef';

// const baseUrl = 'http://10.0.2.2:8082/api/v3/';
// const baseUrl = 'https://uatarcretailreportapi.edelweissarc.in/api/v3/';
//const baseUrl = 'https://spectrumapi.edelweissarc.in/api/v3/';
const baseUrl = 'https://testappapi.edelweissarc.in/api/v3/';
const getHeaders = async () => {
    try {
        const token = await AsyncStorage.getItem('authtoken');
        return {
            'Content-Type': 'application/json',
            "Token": token
            //   "Token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcI9uYW1lIjoiZ2F3YWRlLm5hcmVuZHJhIiwiYmszZV9pZCI6MSwic2VjdXJldXNlciI6ZmFsc2UsImIhdCI6MTc3MjA0NDEwNCwiZXhwIjoxNzcyMDg3MzA0fQ.ZAqK22R4BQi0YyT5qC1QEzEdOQ1qClWepDPQ0JEBysE"
        }
    } catch (error) {

        console.log(error)
        return null;
    }

}


const Api = {
    login: async (payload, url) => {
        try {
            let response = await fetch(`${baseUrl}/${url}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(payload),
            })
            console.log(response)
            if (!response.ok) {

                throw new Error('Network response was not ok');
            }
            return await response.json()
        } catch (error) {

            throw error;
        }
    },
    send: async (payload, url) => {
        try {
            let response = await fetch(`${baseUrl}/${url}`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(payload),
            });

            console.log({ url, response })
            if (!response.ok) {
                Api.clearStorage('userdetail').then(() => {
                    cusnavigate('Login', []);
                })
                throw new Error('Network response was not ok');
            }
            return await response.json()
        } catch (error) {

            throw error;
        }
    },

    get: async (url, payload = {}) => {
        try {
            let response = await fetch(`${baseUrl}/${url}`, {
                method: 'GET',
                headers: await getHeaders(),
                // body: JSON.stringify(payload),
            })
            if (!response.ok) {
                throw new Error("Network error")
            }
            return await response.json();
        } catch (error) {
            console.log(error)
            throw error
        }
    },
    getuserdetails: async (key = '') => {
        try {

            let user = JSON.parse(await AsyncStorage.getItem('userdetail'))

            if (key != '') {
                return user.userDetails[0][key]
            }
            return user
        } catch (error) {
            console.log(error)
        }
    },
    sendTest: async (payload, url) => {
        console.log(await getHeaders())
        try {
            let response = await fetch(`http://10.0.2.2:8082/api/v3/${url}`, {
                method: 'POST',
                headers: await getHeaders(),
                body: payload
            })
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json()
        } catch (error) {

            throw error;
        }
    },
    clearStorage: async (key = null) => {
        try {
            if (key) {
                await AsyncStorage.removeItem(key)
            }
            else {
                await AsyncStorage.clear()
            }
            return true
        } catch (error) {
            console.log(error)
            return false;
        }
    },
    setItem: (key, sharedData) => {
        AsyncStorage.setItem(key, JSON.stringify(sharedData))
            .then(res => { })
            .catch(err => { })
    },
    getItem: async (key) => {
        let result = await AsyncStorage.getItem(key)
        return JSON.parse(result);
    },
    setOfflineSync: async (input, is_new = false) => {

        try {
            let user = await Api.getItem('userdetail');
            let username = user.userDetails[0].USER_NAME;
            let urlsync = await AsyncStorage.getItem('urlsync');

            urlsync = urlsync === null ? {} : JSON.parse(urlsync);

            if (!urlsync[username]) {
                data = [];
            } else {
                data = is_new ? [] : [...urlsync[username]];
            }

            Array.isArray(input) ? data = input : data.push(input);
            let authUser = { [username]: data };
            AsyncStorage.setItem('urlsync', JSON.stringify(authUser)).then(res => {
                // console.log()
            }).catch(err => {
                // console.log(err)
            })
            return;

        } catch (error) {
            console.log(error)
        }
    },
    autosync: async () => {
        console.log("Yes call");
        let failed = Api.getItem('userdetail').then(user => {
            AsyncStorage.getItem('urlsync')
                .then(res => {
                    try {
                        let retailns = [];
                        res = JSON.parse(res);
                        let username = user.userDetails[0].USER_NAME;
                        let arlenth = res[username].length;
                        res[username].forEach(async (itm, index) => {

                            try {
                                let result = await fetch(`${itm.url}`, {
                                    method: 'POST',
                                    headers: await getHeaders(),
                                    body: JSON.stringify(itm),
                                });
                                let rsp = await result.json();
                                if (result.status != 200) {
                                    retailns.push(itm)
                                }
                                if ((arlenth - 1) == index && retailns.length > 0) {
                                    Api.setOfflineSync(retailns);
                                }
                                if ((arlenth - 1) == index && retailns.length == 0) {
                                    await Api.clearStorage('urlsync')
                                }
                            } catch (error) {
                                retailns.push(itm)
                                if ((arlenth - 1) == index && retailns.length > 0) {
                                    Api.setOfflineSync(retailns);
                                }
                                if ((arlenth - 1) == index && retailns.length == 0) {
                                    await Api.clearStorage('urlsync')
                                }

                            }



                            // fetch(`${baseUrl}/${itm.url}`,{
                            //     method: 'POST',
                            //     headers: await getHeaders(),
                            //     body: JSON.stringify(itm),
                            // }).then(response=>{
                            //     if(response.status !== 200){
                            //         retailns.push(itm)

                            //     }

                            // }).catch(err=>err)

                            //    Api.setItem 
                        })
                        // let allurls  = res[user.userDetails[0].USER_NAME].map(async(itm)=>{

                        //     return  fetch(`${baseUrl}/${itm.url}`,{
                        //                 method: 'POST',
                        //                 headers: await getHeaders(),
                        //                 body: JSON.stringify(itm),
                        //             })
                        // })
                        // let retailns = [];
                        // Promise.all(allurls).then(res=>{
                        //     res.forEach(async(element,index) => {
                        //         if(element.status != 200){
                        //             retailns.push(index);
                        //         }
                        //         console.log({element: await element.json()});
                        //     });


                        // }).catch(err=>{
                        //     console.log(err)
                        // })
                    } catch (inerr) {
                        console.log(inerr)
                    }

                }).catch(err => {
                    console.log(err, "========")
                })
        }).catch(err => {
            console.log(err, "++++++")
        })

    },
    setMode: async (mode) => {
        let modetype = await AsyncStorage.setItem('modeType', mode)
        return;
    },
    getMode: async () => {
        let mode = await AsyncStorage.getItem('modeType');
        return mode;
    },
    sendRequest: async (payload, url) => {
        try {
            console.log(baseUrl);
            let response = await fetch(`${baseUrl}/${url}`, {
                method: 'POST',
                headers: await getHeaders(),
                body: JSON.stringify(payload),
            });
            // console.log({aa:JSON.stringify(payload)})
            return response;
            // console.log({url,response})
            // if(!response.ok){
            //     Api.clearStorage('userdetail').then(()=>{
            //          cusnavigate('Login',[]);
            //     })
            //     throw new Error('Network response was not ok');
            // }
            // return await response.json()
        } catch (error) {

            throw error;
        }
    },




}

export default Api;