import axios from "axios";

import {
    url
} from "../constants"


import m from "mithril"
import moment from "moment"

import { DateRangePicker } from '../components/daterangepicker';

import loader from "../components/loader"
import expenses from "../pages/expenses"
import stock_levels from "../pages/stock_levels"


const detailsString = (job) => {
    const orderItems = ["duvets", "blankets", "curtains", "generalKgs",];
    return Object.keys(job)
        .filter((key) => orderItems.includes(key))
        .map((key) => {
            return `${job[key]} ${key}`;
        })
        .join(", ");
};

const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}




const StatNumber = {
    view(vnode) {
        return m("h3", { "class": "card-title align-items-start flex-column d-flex mr-3", style: { whiteSpace: "nowrap" } },
            [
                m("span", { "class": "fs-6 fw-semibold text-gray-500", style: "align-self: flex-start;" },
                    vnode.attrs.title
                ),
                m("div", { "class": "d-flex align-items-center mb-2" },
                    [
                        m("span", { "class": "fs-3 fw-semibold text-gray-500 align-self-start me-1" },
                            vnode.attrs.symbol
                        ),
                        m("span", { "class": "fs-2hx fw-bold text-gray-800 me-2 lh-1 ls-n2" },
                            vnode.attrs.amount
                        ),
                    ]
                ),

            ]
        )
    }
}


const orders = {

    oninit(vnode) {
        vnode.state.jobs = []
        vnode.state.pricings = []
        vnode.state.stores = []
        vnode.state.expenses = []
        vnode.state.categories = []
        vnode.state.loading = true
        vnode.state.selectedDate = new Date()

        // Retrieve businessDate from localStorage and convert it to a Date object
        const storedBusinessDate = localStorage.getItem("businessDate");
        let selectedDate;

        if (storedBusinessDate) {
            // If businessDate exists in localStorage, parse it as a Date
            selectedDate = new Date(storedBusinessDate);
        } else {
            // If businessDate is not found in localStorage, set a default value (e.g., current date)
            selectedDate = new Date(); // Default to current date/time
            const storageFormattedDate = selectedDate.toISOString(); // Convert to ISO string for storage
            localStorage.setItem("businessDate", storageFormattedDate); // Save to localStorage
        }

    },
    oncreate(vnode) {
        const options = {
            method: 'GET',
            url: url + "/jobs",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.jobs = response.data.filter((job) => {
                const googleId = localStorage.getItem('googleId')
                const role = localStorage.getItem('role')
                if (role && role === 'OWNER') return true

                if (job.googleId)
                    return true
            })

            vnode.state.jobs.map(job => {
                Object.assign(job, {
                    createdAtAgo: moment(job.createdAt).fromNow(true),
                    timeDroppedOffFromNow: moment(job.dropOffDay).fromNow(true),
                    timePickedUpFromNow: moment(job.pickupDay).fromNow(true),
                })

                if (job.categoryAmounts) {
                    const calculatePrice = () => {
                        return Object.keys(job.categoryAmounts).reduce((total, categoryId) => {
                            const amountValue = job.categoryAmounts[categoryId] || 0;
                            const chargeValue = job.categoryCharges[categoryId] || 0;
                            const subtotal = amountValue * chargeValue;
                            return total + subtotal;
                        }, 0);
                    };

                    job.price = calculatePrice();
                }
            })

            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            console.error(error);
        });

        const optionsPricing = {
            method: 'GET', url: url + "/pricings",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsPricing).then(function (response) {
            vnode.state.pricings = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsStores = {
            method: 'GET', url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsStores).then(function (response) {
            vnode.state.stores = response.data
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsCategories = {
            method: 'GET', url: url + "/categories",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsCategories).then(function (response) {
            vnode.state.categories = response.data
            // console.log(vnode.state.categories)
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });

        const optionsExpenses = {
            method: 'GET', url: url + "/expenses",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsExpenses).then(function (response) {
            vnode.state.expenses = response.data

            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    view(vnode) {
        var jobs = vnode.state.jobs
            .filter(job => {
                const selectedDate = new Date(localStorage.getItem("businessDate"));

                // Assuming job.businessDate is a valid date string
                const businessDate = new Date(job.businessDate);
                // console.log(businessDate.toLocaleDateString(), selectedDate.toLocaleDateString())
                return businessDate.toLocaleDateString() == selectedDate.toLocaleDateString();
            })
            .filter(job => {
                if (localStorage.getItem("storeId"))
                    return job.storeId == localStorage.getItem("storeId")

                return true
            })
            .sort((a, b) => {
                // Assuming createdAtDateTime is a valid date string
                const dateA = new Date(a.createdAtDateTime);
                const dateB = new Date(b.createdAtDateTime);

                // Compare dates for sorting
                return dateA - dateB;
            })

        const selectedDate = new Date(localStorage.getItem("businessDate"));
        const storeId = localStorage.getItem("storeId");

        // Process stats
        const totalSales = jobs.reduce((total, job) => total + (job.price || 0), 0);
        const totalPaid = jobs.reduce((total, job) => total + (job.paid ? (job.price || 0) : 0), 0);
        const totalUnpaid = jobs.reduce((total, job) => total + (job.paid ? 0 : (job.price || 0)), 0);

        const totalUniqueCustomers = new Set(jobs.map(job => job.phone)).size;

        // Function to calculate total expenses on a business day
        function calculateTotalExpenses(expenses, businessDate, storeId) {
            let totalExpenses = 0;
            const targetDate = new Date(businessDate);
        
            // Object to store total expenses per store
            const storeTotalExpenses = {};
        
            // Iterate through expenses
            for (const expense of expenses) {
                const expenseDate = new Date(expense.businessDate);
                const currentStoreId = expense.storeId;
        
                if (expense.recurrent) {
                    // Accumulate recurrent expenses for each store
                    if (!storeTotalExpenses[currentStoreId]) {
                        storeTotalExpenses[currentStoreId] = parseInt(expense.cost);
                    } else {
                        storeTotalExpenses[currentStoreId] += parseInt(expense.cost);
                    }
                } else {
                    // Check if the expense falls on the specified business date
                    if (storeId && currentStoreId === storeId && expenseDate.toISOString().split('T')[0] === targetDate.toISOString().split('T')[0]) {
                        // Add the cost of non-recurrent expenses for the specified store and day
                        totalExpenses += parseInt(expense.cost);
                    }
                }
            }
        
            // If storeId is provided, return the total expenses for that store on the specified day
            if (storeId) {
                totalExpenses = storeTotalExpenses[storeId] || 0;
            } else {
                // If storeId is not provided, calculate cumulative total expenses across all stores
                for (const storeId in storeTotalExpenses) {
                    totalExpenses += storeTotalExpenses[storeId];
                }
            }
        
            return totalExpenses;
        }
        







        const totalExpenses = calculateTotalExpenses(vnode.state.expenses, selectedDate, storeId);
        const totalProfit = Number(totalSales) - Number(totalExpenses)

        const storeName = vnode.state.stores.find(s => s._id == storeId)?.title

        vnode.state.stats = {
            totalSales,
            totalPaid,
            totalUnpaid,
            totalUniqueCustomers,
            totalExpenses
        };


        const formattedBusinessDate = selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

        const date = `${formattedBusinessDate}`;

        const filteredJobs = vnode.state.jobs
        .filter(job => {
            const selectedDate = new Date(localStorage.getItem("businessDate"));

            // Assuming job.businessDate is a valid date string
            const businessDate = new Date(job.businessDate);
            // console.log(businessDate.toLocaleDateString(), selectedDate.toLocaleDateString())
            return businessDate.toLocaleDateString() == selectedDate.toLocaleDateString();
        })
        .filter(job => {
            if (localStorage.getItem("storeId"))
                return job.storeId == localStorage.getItem("storeId")

            return true
        })
        .sort((a, b) => {
            // Assuming createdAtDateTime is a valid date string
            const dateA = new Date(a.createdAtDateTime);
            const dateB = new Date(b.createdAtDateTime);

            // Compare dates for sorting
            return dateA - dateB;
        })

        return [
            m("div", { "class": "table-responsive" },
                !vnode.state.loading ? m("table", { style: { "overflow-x": "auto", "class": "table table-borderless table-vertical-center" } },
                    [
                        m("thead",
                            m("tr",
                                [
                                    m("th", { "class": "p-0 w-50px" }),
                                    m("th", { "class": "p-0 w-50px" }),
                                    // m("th", { "class": "p-0 min-w-200px" }),
                                    m("th", { "class": "p-0 w-50px" }),
                                    m("th", { "class": "p-0 w-50px" }),
                                    m("th", { "class": "p-0 w-50px" }),
                                    m("th", { "class": "p-0 w-50px" }),
                                    m("th", { "class": "p-0 w-50px" }),
                                ]
                            )
                        ),
                        m("tbody", [
                            m("tr", {
                                // key: id,
                                style: { "cursor": "pointer" },
                                // class: { "white- space": " nowrap; ", }
                            },
                                [
                                    // m("td", { "class": "pl-0 py-5" },
                                    //     m("div", { "class": "symbol symbol-45 symbol-light mr-2" },
                                    //         m("span", { "class": "symbol-label" },
                                    //             m("img", { "class": "h-50 align-self-center", "src": "assets/media/svg/misc/015-telegram.svg", "alt": "" })
                                    //         )
                                    //     )
                                    // ),


                                    m("td", { "class": "text-right", onclick() { m.route.set("/j/" + _id) } },
                                        [
                                            m(StatNumber, {
                                                title: "Total Sales",
                                                amount: formatCurrency(totalSales),
                                                symbol: 'Ksh'
                                            })
                                        ]
                                    ),

                                    m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                        [
                                            m(StatNumber, {
                                                title: "Total Paid",
                                                amount: formatCurrency(totalPaid),
                                                // symbol: 'Ksh'
                                            })
                                        ]
                                    ),

                                    m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                        [
                                            m(StatNumber, {
                                                title: "Total Unpaid",
                                                amount: formatCurrency(totalUnpaid),
                                                // symbol: 'Ksh'
                                            })
                                        ]
                                    ),

                                    m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                        [
                                            m(StatNumber, {
                                                title: "Total Expenses",
                                                amount: formatCurrency(totalExpenses),
                                                // symbol: 'Ksh'
                                            })
                                        ]
                                    ),

                                    m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                        [
                                            m(StatNumber, {
                                                title: "Profit",
                                                amount: formatCurrency(totalProfit),
                                                // symbol: 'Ksh'
                                            })
                                        ]
                                    ),

                                    m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                        [
                                            m(StatNumber, {
                                                title: "Total Unique Leads",
                                                amount: totalUniqueCustomers,
                                                symbol: 'Leads'
                                            })
                                        ]
                                    ),

                                    // m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                    //     [
                                    //         m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                    //             " Total Expenses: X"
                                    //         ),
                                    //     ]
                                    // ),

                                ]
                            )
                        ]
                        )
                    ]
                ) : []
            ),
            m("div", { "class": "card card-custom gutter-b" }, [
                m("div", { "class": "card card-custom gutter-b" }, [
                    m("div", { "class": "card-header border-0 pt-7" },
                        [
                            m("h3", { "class": "card-title align-items-start flex-column" },
                                [
                                    m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                        "Job Queue for " + date
                                    ),
                                    m("span", { "class": "text-muted font-weight-bold text-hover-primary", },
                                        (storeName ? "in Store " + storeName : "Showing All Stores")
                                    )
                                ]
                            ),
                            m("div",
                                m("button", {
                                    "class": "btn btn-sm btn-info", onclick() {
                                        m.route.set("/q-new")
                                    }
                                },
                                    [
                                        m("i", { "class": "flaticon-add-circular-button" }),
                                        "Add Job"
                                    ]
                                )
                            )
                        ]
                    ),
                    m("div", { "class": "tab-content mt-2", "id": "myTabTable5" }, [

                        m("div", { "class": "card-body pt-0 pb-4" },
                            m("div", { "class": "tab-content mt-2", "id": "myTabTable5" },
                                [
                                    m("div", { "class": "tab-pane fade", "id": "kt_tab_table_5_1", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_1" },
                                        m("div", { "class": "table-responsive" },
                                            m("table", { "class": "table table-borderless table-vertical-center" },
                                                [
                                                    m("thead",
                                                        m("tr",
                                                            [
                                                                m("th", { "class": "p-0 w-50px" }),
                                                                m("th", { "class": "p-0 min-w-200px" }),
                                                                m("th", { "class": "p-0 min-w-100px" }),
                                                                m("th", { "class": "p-0 min-w-125px" }),
                                                                m("th", { "class": "p-0 min-w-110px" }),
                                                                m("th", { "class": "p-0 min-w-150px" })
                                                            ]
                                                        )
                                                    ),

                                                ]
                                            )
                                        )
                                    ),

                                    m("div", { "class": "tab-pane fade show active", "id": "kt_tab_table_5_3", "role": "tabpanel", "aria-labelledby": "kt_tab_table_5_3" },
                                        m("div", { "class": "table-responsive" },
                                            vnode.state.loading ? m(loader) : m("table", { "class": "table table-borderless table-vertical-center" },
                                                [
                                                    m("thead",
                                                        m("tr",
                                                            [
                                                                m("th", { "class": "p-0 w-50px" }),
                                                                m("th", { "class": "p-0 min-w-200px" }),
                                                                m("th", { "class": "p-0 min-w-100px" }),
                                                                m("th", { "class": "p-0 min-w-125px" }),
                                                                m("th", { "class": "p-0 min-w-110px" }),
                                                                m("th", { "class": "p-0 min-w-150px" })
                                                            ]
                                                        )
                                                    ),
                                                    m("tbody",
                                                        [
                                                            filteredJobs.length == 0 ? [
                                                                m("tr", {
                                                                    style: { textAlign: "center" } // Inline style for centering content
                                                                }, [
                                                                    m("td", {
                                                                        colspan: 4 // Spanning across all 3 columns
                                                                    }, [
                                                                        m("svg", {
                                                                            width: "250", // Set SVG width (adjust as needed)
                                                                            height: "250" // Set SVG height (adjust as needed)
                                                                        }, [
                                                                            // Image element within SVG
                                                                            m("image", {
                                                                                href: "./undraw_add_information_j2wg.svg", // URL of the SVG image
                                                                                width: "200", // Set image width within SVG (adjust as needed)
                                                                                height: "200", // Set image height within SVG (adjust as needed)
                                                                                x: "25", // X position of the image within SVG canvas
                                                                                y: "25" // Y position of the image within SVG canvas
                                                                            }),
                                                                            // Text element below the image
                                                                            m("text", {
                                                                                x: "50%",
                                                                                y: "230",
                                                                                "text-anchor": "middle", 
                                                                                fill: "black" // Text color
                                                                            }, "No Sales yet for " + storeName + " - " + date) // Text content
                                                                        ]),
                                                                        m("br"),
                                                                        // Button element below the SVG and text
                                                                        m("button", {
                                                                            class: "btn btn-sm btn-info",
                                                                            onclick: () => {
                                                                                m.route.set("/q-new");
                                                                                setTimeout(() => {
                                                                                    location.reload();
                                                                                }, 1000);
                                                                            }
                                                                        }, [
                                                                            m("i", { class: "flaticon-add-circular-button" }), 
                                                                            "Add Some" 
                                                                        ])
                                                                    ])
                                                                ])
                                                                
                                                                
                                                            ] :
                                                            // console.log(vnode.state.selectedDate),
                                                            filteredJobs
                                                                .map(({
                                                                    _id,
                                                                    paid = "",
                                                                    status = "",
                                                                    appartmentName = "",
                                                                    houseNumber = "",
                                                                    moreDetails = "",
                                                                    clientName,
                                                                    mpesaPhoneNumber,
                                                                    phone,
                                                                    mpesaConfirmationCode,
                                                                    timeDroppedOffFromNow,
                                                                    timePickedUpFromNow,
                                                                    generalKgs = 0,
                                                                    categoryAmounts = {},
                                                                    categoryCharges = {}
                                                                }, index) => {
                                                                    const calculatePrice = () => {

                                                                        return Object.keys(categoryAmounts).reduce((total, categoryId) => {
                                                                            const amountValue = categoryAmounts[categoryId];
                                                                            const chargeValue = categoryCharges[categoryId];

                                                                            const subtotal = (amountValue || 0) * (chargeValue || 0);
                                                                            return total + subtotal;
                                                                        }, 0);
                                                                    }

                                                                    return m("tr", {
                                                                        // key: id,
                                                                        style: { "cursor": "pointer" }
                                                                    },
                                                                        [
                                                                            // m("td", { "class": "pl-0 py-5" },
                                                                            //     m("div", { "class": "symbol symbol-45 symbol-light mr-2" },
                                                                            //         m("span", { "class": "symbol-label" },
                                                                            //             m("img", { "class": "h-50 align-self-center", "src": "assets/media/svg/misc/015-telegram.svg", "alt": "" })
                                                                            //         )
                                                                            //     )
                                                                            // ),
                                                                            m("td", {
                                                                                "class": "pl-0", onclick() { m.route.set("/j/" + _id) }
                                                                            },
                                                                                [
                                                                                    m("span", { "class": "text-dark-75 font-weight-bolder text-hover-primary mb-1 font-size-lg", style: "white-space: nowrap;" },
                                                                                        m("b", (Number(index) + 1) + ". " + clientName + " (" + phone + ")")
                                                                                    ),

                                                                                    m("div",
                                                                                        [
                                                                                            // categoryAmounts,
                                                                                            [Object.keys(categoryAmounts)
                                                                                                .filter(charge => categoryAmounts[charge] !== 0)
                                                                                                .map(charge => {
                                                                                                    const categoryName = vnode.state.categories.find(category => category._id === charge)?.title;
                                                                                                    const chargeAmount = categoryCharges[charge];
                                                                                                    const numberOfItems = categoryAmounts[charge];

                                                                                                    return `${numberOfItems} ${categoryName} @${chargeAmount} `;
                                                                                                })],
                                                                                            m("span", { "class": "font-weight-bolder text-dark-75", style: "white-space: nowrap;" },
                                                                                                `${appartmentName}:`, [m("span", { "class": "text-muted font-weight-bold text-hover-primary", },
                                                                                                    " House:" + houseNumber
                                                                                                )]
                                                                                            )
                                                                                        ]
                                                                                    )
                                                                                ]
                                                                            ),

                                                                            m("td", { "class": "text-left", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                                [
                                                                                    m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                        `KSH ${calculatePrice()}`
                                                                                    ),
                                                                                    m("span", { "class": "text-muted font-weight-bold" },
                                                                                        paid ? "Paid " : " Not Paid"
                                                                                    )
                                                                                ]
                                                                            ),

                                                                            m("td", { "class": "text-left", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                                [
                                                                                    m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg", style: "white-space: nowrap;", },


                                                                                    ),
                                                                                    m("span", { "class": "text-muted font-weight-bold", style: "white-space: nowrap;", },
                                                                                        moreDetails
                                                                                    )
                                                                                ]
                                                                            ),
                                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/j/" + _id) } },
                                                                                [
                                                                                    m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                                        " Status " + status ? status : " No Status Updated"
                                                                                    ),
                                                                                ]
                                                                            ),
                                                                            m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                                                m('div', { "class": "" },
                                                                                    [
                                                                                        // m(editPricing, { "pricing": item }),
                                                                                        m('a', {
                                                                                            href: "javascript:void(0);",
                                                                                            "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                                const options = {
                                                                                                    method: 'DELETE',
                                                                                                    url: `${url}/jobs/${_id}`,
                                                                                                    headers: {
                                                                                                        'Content-Type': 'application/json',
                                                                                                        'authorization': localStorage.getItem('token')
                                                                                                    },
                                                                                                };

                                                                                                axios.request(options).then(function (response) {

                                                                                                    vnode.state.jobs = vnode.state.jobs.filter(p => p._id != _id)
                                                                                                    m.redraw()
                                                                                                }).catch(function (error) {
                                                                                                    console.error(error);
                                                                                                });
                                                                                            }
                                                                                        },
                                                                                            m('icon', { "class": "flaticon2-rubbish-bin-delete-button" })
                                                                                        )
                                                                                    ])
                                                                            )
                                                                        ]
                                                                    )
                                                                })
                                                        ]
                                                    )
                                                ])
                                        )
                                    )
                                ]
                            )
                        )],
                    )
                ])
            ]),
            m(expenses),
            m(stock_levels)
        ]
    }
}

export default orders