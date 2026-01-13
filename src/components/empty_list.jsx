import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import React from "react";
import { ButtonOptions } from "./button_options";

export const EmptyList = props => {
    const { icon, name, options, onCreate } = props
    const title = props.title || `No ${name}`
    const description = props.description || `Get started by creating a new ${name}.`

    const visual = { icon }

   return (
       <div className="text-center mt-12">
           <visual.icon className="mx-auto h-12 w-12 text-gray-400"/>

           <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
           <p className="mt-1 text-sm text-gray-500">{description}</p>
           {onCreate !== undefined && (
           <div className="mt-6">
               {options === undefined &&
               <button
                   type="button"
                   className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                   onClick={onCreate}>
                   <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                   Create {name}
               </button>
               }
               {options !== undefined &&
                   <ButtonOptions
                       align="left"
                       options={options}
                       onClick={onCreate}>
                       <PlusIcon className="mr-1 h-5 w-5 shrink-0" aria-hidden="true"/>
                       Create {name}
                   </ButtonOptions>
               }
           </div>
           )}
       </div>
   )
}