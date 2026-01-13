import React, { useEffect } from "react";
import * as Util from "../helpers/util";
import { useStore } from "../store";

export const WelcomeBack = props => {
    const { showToast } = props
    const { usr_info, setUsrInfo } = useStore( x => x )

    useEffect( () => {
        //Welcome message?
        if ( usr_info.client_settings && usr_info.client_settings.welcome_back ) {
            showToast( `Welcome back ${usr_info.name}!`, "success" )
            Util.fetch_js('/api/human/client_settings/', { welcome_back: false },
                js => {
                    setUsrInfo( js.human )
                }, showToast)
        }
    }, [] );

   return (
       <></>
   )
}