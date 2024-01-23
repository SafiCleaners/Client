import axios from "axios";

import {
    url
} from "../constants"


import m from "mithril"
import moment from "moment"

import { DateRangePicker } from '../components/daterangepicker';

import loader from "../components/loader"
const detailsString = (job) => {
    const orderItems = ["duvets", "blankets", "curtains", "generalKgs",];
    return Object.keys(job)
        .filter((key) => orderItems.includes(key))
        .map((key) => {
            return `${job[key]} ${key}`;
        })
        .join(", ");
};
const orders = {

    oninit(vnode) {
        vnode.state.jobs = []
        vnode.state.pricings = []
        vnode.state.categories = []
        vnode.state.loading = true
        vnode.state.selectedDate = new Date()
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

        const optionsCategories = {
            method: 'GET', url: url + "/categories",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(optionsCategories).then(function (response) {
            vnode.state.categories = response.data
            console.log(vnode.state.categories)
            vnode.state.loading = false
            m.redraw()
        }).catch(function (error) {
            vnode.state.loading = false
            m.redraw()
            console.error(error);
        });
    },
    view(vnode) {
        return m("div", { "class": "card card-custom gutter-b" },
            [
                [
                    m("div", { "class": "card-header border-0 pt-7" },
                        [
                            m("h3", { "class": "card-title align-items-start flex-column" },
                                [
                                    m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                        "Job Queue"
                                    )
                                ]
                            ),
                            m("div",
                                m("button", {
                                    "class": "btn btn-lg btn-info", onclick() {
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
                                        !vnode.state.loading ? m("table", { "class": "table table-borderless table-vertical-center" },
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
                                                        vnode.state.jobs
                                                            .filter(job => {
                                                                const storedStartDate = localStorage.getItem("businessRangeStartDate");
                                                                const storedEndDate = localStorage.getItem("businessRangeEndDate");

                                                                // Assuming storedStartDate and storedEndDate are valid date strings
                                                                const startDate = new Date(storedStartDate);
                                                                const endDate = new Date(storedEndDate);

                                                                const businessDate = new Date(job.businessDate);

                                                                console.log({ businessDate, startDate, businessDate, endDate })
                                                                // Check if the job's business date is within the stored date range
                                                                return businessDate >= startDate && businessDate <= endDate;
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
                                                                console.log({index})
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
                                            ]
                                        ) : m(loader)
                                    )
                                )
                            ]
                        )
                    )
                ]
            ]
        )
    }
}

export default orders