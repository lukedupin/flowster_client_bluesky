import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import * as Util from "../helpers/util";
import { useEffect, useState } from "react";


//Paginate an array
export const paginateArray = (arr, page, per_page) => {
    if ( !arr ) {
        return []
    }
    if ( arr.length <= per_page * 2 ) {
        return arr
    }

    //Cap the page
    const total_pages = Math.max( Math.ceil(arr.length / per_page), 1 )
    if ( page >= total_pages ) {
        page = total_pages - 1
    }
    if ( page < 1 ) {
        page = 1
    }

    return arr.slice((page - 1) * per_page, page * per_page)
}

export const Pagination = props => {
    const { page, per_page, total, onPage } = props
    const total_pages = Math.max( Math.ceil(total / per_page), 1 )

    const [state, setState] = useState({
        isMD: Util.isMD(),
        page: null,
    });
    const { isMD } = state

    useEffect(() => {
        function handleResize() {
            setState(prev => ({...prev,
                isMD: Util.isMD()
            }))
        }

        // Call handleResize initially
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    const handlePage = (page) => {
        if ( page < 1 || page > total_pages ) {
            return
        }

        onPage(page)
    }

    const pagination = () => {
        const slots = (isMD) ? 5 : 7

        //Easy, dump all the pages
        if ( total_pages <= slots ) {
            return Array.from({length: total_pages}, (_, i) => i + 1)
        }

        //5 slot config
        if ( !isMD ) {
            if ( page < 3 ) {
                return [1, 2, 3, null, total_pages]
            }
            else if ( page > total_pages - 2 ) {
                return [1, null, (total_pages - 2), (total_pages - 1), total_pages]
            }
            else {
                return [1, null, page, null, total_pages]
            }
        }
        else {
            if ( page < 4 ) {
                return [1, 2, 3, 4, null, (total_pages - 1), total_pages]
            }
            else if ( page > total_pages - 3 ) {
                return [1, 2, null, (total_pages - 3), (total_pages - 2), (total_pages - 1), total_pages]
            }
            else {
                return [1, null, (page - 1), page, (page + 1), null, total_pages]
            }
        }
    }
    const pages_list = pagination()

    //Nothing to paginate
    if ( total_pages <= 2 ) {
        return null
    }

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                <div className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     onClick={() => handlePage( page - 1 )}>
                    Previous
                </div>
                <div className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     onClick={() => handlePage( page + 1 )}>
                    Next
                </div>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * per_page}</span> to <span className="font-medium">{page * per_page}</span> of{' '} <span className="font-semibold">{total}</span> results
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <div className="cursor-pointer relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                             onClick={() => handlePage(page-1)}>
                            <span className="sr-only">Previous</span>
                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        {pages_list.map( ( p, idx ) => {
                            if ( p !== null ) {
                                return (
                                    <div key={`page_${idx}`}
                                         className={Util.classNames(
                                             "cursor-pointer relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0",
                                             page === p ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" : "text-gray-900")}
                                         onClick={() => handlePage(p)}>
                                        {p}
                                    </div>)
                            }
                            else {
                                return (<span key={`page_${idx}`}
                                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                        ...
                                    </span>
                                )
                            }
                        })}
                        <div className="cursor-pointer relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                             onClick={() => handlePage(page + 1)}>
                            <span className="sr-only">Next</span>
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    )
}
