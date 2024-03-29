import axios from "axios";
var equal = require('deep-equal');
import {
    url,
    operationTimes
} from "../constants"
import m from "mithril"
import uploader from "../components/uploader"
import map from "./map";
import input from "./input";
import dayRangeCalculator from "../dateCalculator";
import moment from "moment"
import _ from "underscore"



const datepicker = {
    oncreate(vnode) {
        $('#kt_datepicker_1').datetimepicker({
            pickerPosition: 'bottom-left',
            todayHighlight: true,
            autoclose: true
        });
    },
    view(vnode) {
        return m("div", { "class": "form-group row" },
            [
                m("label", { "class": "col-form-label text-right col-lg-3 col-sm-12" },
                    "Drop off date"
                ),
                m("div", { "class": "col-lg-4 col-md-9 col-sm-12" },
                    m("input", {
                        "class": "form-control", "type": "text", "id": "kt_datepicker_1", "readonly": "readonly", "placeholder": "Select date",
                        oninput: (e) => {
                            vnode.state.dropOffDate = e.target.value
                        },
                    })
                )
            ]
        )
    }
}

var calculator = () => {
    return {
        oninit: function (vnode) {
            var cost = 0
            var price = 0

            vnode.state = Object.assign(vnode.state, {
                // select today automatically
                pickupDay: moment(new Date()).format('L'),
                // select tommorow automatically
                dropOffDay: moment(new Date()).add(1, 'days').format('L'),
                pickupTime: '10am-11am',
                dropOffTime: '10am-11am',
                googleId: localStorage.getItem('googleId'),
                clientName: '',
                phone: '',
                //appartmentName: '',
                // houseNumber: '',
                //moreDetails: '',
                curtains: 0,
                blankets: 0,
                duvets: 0,
                generalKgs: 0,
                mpesaPhoneNumber: 0,
                mpesaConfirmationCode: '',
                calculatePrice() {
                    return cost
                },
                statusInfo: vnode.state.statusInfo ? vnode.state.statusInfo : [{
                    status: "LEAD",
                    createdAt: new Date()
                }],
                startedAt: new Date(),
                saved: false,
                uploading: false,
            }, JSON.parse(localStorage.getItem("activeOrder")))



            // create an order if there was not one already running
            // cache order in local storage even accross refreshes
            let activeOrderId = localStorage.getItem("activeOrderId")

            // if (!activeOrderId) {
            //     activeOrderId = new ObjectId()
            //     localStorage.setItem("activeOrderId", activeOrderId)
            // }
            vnode.state.id = activeOrderId
            vnode.state.clearInternalActiveOrderId = () => { activeOrderId = null }

            const role = localStorage.getItem('role')
            if (role && ['OWNER', "INTERNAL"].includes(role)) {
                vnode.state.isInternaluser = true
            }

            // function to update order on the server
            const updateOrderOnServer = (cb) => {
                if (!['/', ''].includes(m.route.get())) {
                    return;
                }

                var {
                    pickupDay,
                    dropOffDay,
                    pickupTime,
                    dropOffTime,
                    //appartmentName,
                    // houseNumber,
                    moreDetails,
                    curtains,
                    blankets,
                    duvets,
                    generalKgs,
                    mpesaPhoneNumber,
                    phone,
                    mpesaConfirmationCode,
                    name,
                    clientName,
                    statusInfo,
                    saved
                } = vnode.state

                let order = Object.assign({
                    pickupDay,
                    dropOffDay,
                    pickupTime,
                    dropOffTime,
                    //appartmentName,
                    //houseNumber,
                    moreDetails,
                    curtains,
                    blankets,
                    duvets,
                    generalKgs,
                    mpesaPhoneNumber,
                    phone,
                    mpesaConfirmationCode,
                    name,
                    clientName,
                    statusInfo,
                    saved
                }, {
                    googleId: localStorage.getItem('googleId'),
                    userId: localStorage.getItem('googleId'),
                    storeId: localStorage.getItem('storeId'),
                });

                console.log(order)

                if (!order.name && localStorage.getItem("authToken")) {
                    order.name = localStorage.getItem("name")
                }

                let activeOrderId = localStorage.getItem("activeOrderId")

                // check if the order has changed before sending it to the server
                const orderString = JSON.parse(localStorage.getItem("activeOrder"));

                // lets update localstorage here


                // 
                if (equal(order, orderString) && activeOrderId) {
                    // console.log("Order has not changed. Not sending request to server.");  
                    return;
                } else {
                    localStorage.setItem("activeOrder", JSON.stringify(order))
                    console.log("Calc Order has changed, updating the backend", { orderSentToServer: order }, { orderStringFromLocalStorage: orderString })
                }

                const orderDetailsDiff = _.omit(order, function (v, k) { return orderString && orderString[k] === v; })
                // console.log({ orderDetailsDiff })

                order.lastSubmittedAt = new Date()
                // send request to server
                const options = {
                    method: 'PATCH',
                    url: url + "/jobs/" + activeOrderId,
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': localStorage.getItem('token')
                    },
                    data: order
                };

                console.log(options)
                vnode.state.uploading = true
                axios.request(options).then(function (response) {
                    //save orderId from server response to local storage
                    const orderIdFromServer = response.data.id;
                    localStorage.setItem("activeOrderId", orderIdFromServer);
                    console.log("Order ID from server:", response.data);


                    // to ensure order stays the same but we know when it was last submitted
                    order.lastSubmittedAt = undefined;
                    localStorage.setItem("activeOrder", JSON.stringify(order))
                    vnode.state.uploading = false
                    // Check if the order is saved successfully
                    order.jobUrl = response.data.jobUrl
                    // Internal routing using m.route.set

                    if (!vnode.state.isInternaluser) {
                        m.route.set("/thankyou", {
                            order: order
                        });
                    } else {
                        m.location.reload()
                    }


                    cb()

                }).catch(function (error) {
                    order.id = null
                    order.retry_innitial_send = true
                    // vnode.state.activeOrder = order
                    vnode.state.uploading = false
                    vnode.state.saved = false
                    // m.route.set("/order2", {
                    //     order
                    // })
                    console.log("Error while saving order:", error);

                    // External redirection using window.location


                    cb()
                });
            }

            vnode.state.updateOrderOnServer = updateOrderOnServer




        },
        view(vnode) {
            console.log({ vnode })
            var {
                pickupDay,
                dropOffDay,
                pickupTime,
                dropOffTime,
                // appartmentName,
                // houseNumber,
                moreDetails,
                curtains,
                blankets,
                duvets,
                generalKgs,
                mpesaPhoneNumber,
                phone,
                mpesaConfirmationCode,
                name,
                clientName
            } = vnode.state

            return m("div", { "class": "card-body" },

                m("form",
                    [
                        m("div", { "class": "form-group row" },
                            [
                                m("div", { "class": "bs-stepper" },
                                    [
                                        m("div", { "class": "bs-stepper-header", "role": "tablist" },
                                            [
                                                m("div", { "class": "step", "data-target": "#logins-part" },
                                                    m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                                        [
                                                            m("span", { "class": "bs-stepper-circle" },
                                                                "1"
                                                            ),
                                                            m("span", { "class": "bs-stepper-label" },
                                                                "Your Details"
                                                            )
                                                        ]
                                                    )
                                                )]
                                        )]
                                ),

                                localStorage.getItem('authToken') ? [] : m("div", { "class": "col-lg-6" },
                                    [
                                        m("label",
                                            "What is your name"
                                        ),
                                        m("div", { "class": "input-group" },
                                            [
                                                m("input", {
                                                    oninput: (e) => {
                                                        vnode.state.name = e.target.value
                                                    },
                                                    value: name,
                                                    "class": "form-control",
                                                    "type": "text",
                                                    "placeholder": "What name is used to refer to you?"
                                                }),
                                                m("div", { "class": "input-group-append" },
                                                    m("span", { "class": "input-group-text" },
                                                        m("i", { "class": "la la-align-center" })
                                                    )
                                                )
                                            ]
                                        ),
                                        // m("span", { "class": "form-text text-muted" },
                                        //     "The Name that will be used to refer to you during messaging"
                                        // )
                                    ]
                                ),



                                m("div", { "class": "col-xl-4 col-lg-8 col-md-8 col-sm-12" },
                                    [
                                        m("label",
                                            "When would you like your Pickup? "
                                        ),
                                        m("br"),

                                        m("div", { "class": "btn-group btn-group-toggle", "data-toggle": "buttons" },
                                            [
                                                dayRangeCalculator()
                                                    .map((time) => {
                                                        const { dayName, day, nth, date } = time

                                                        return m("label", { "class": `btn btn-info ${pickupDay === date.format('L') ? "focus active" : ""}` },
                                                            [
                                                                m("input", {
                                                                    "type": "radio",
                                                                    "name": "pickupDay",
                                                                    "id": pickupDay,
                                                                    disabled: date.day() === 0,
                                                                    "checked": pickupDay === date.format('L') ? true : false,
                                                                    onchange: () => {
                                                                        vnode.state.pickupDay = date.format('L')

                                                                        let daysToAdd = 1
                                                                        // increment time here to set drop off
                                                                        if (moment(vnode.state.pickupDay).add(daysToAdd, 'days').day() == 0) {
                                                                            daysToAdd = 2
                                                                        }

                                                                        vnode.state.dropOffDay = moment(vnode.state.pickupDay).add(daysToAdd, 'days').format('L')
                                                                    }
                                                                }),
                                                                dayName + " " + day + nth
                                                            ]
                                                        )
                                                    }),
                                            ]
                                        )
                                    ]
                                ),
                                m("div", { "class": "col-lg-2 col-md-4 col-sm-4" },
                                    [
                                        m("label",
                                            "Time of pickup:"
                                        ),
                                        m("div", { "class": "dropdown" },
                                            [
                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                    pickupTime
                                                ),
                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                    [
                                                        operationTimes.map(time => {
                                                            return m("a", {
                                                                style: { "z-index": 10000 },
                                                                onclick(e) {
                                                                    vnode.state.pickupTime = time
                                                                    e.preventDefault()
                                                                },
                                                                "class": "dropdown-item",
                                                            },
                                                                time
                                                            )
                                                        })
                                                    ]
                                                )
                                            ]
                                        )
                                    ]),
                                m("div", { "class": "col-xl-4 col-lg-8 col-md-8 col-sm-12" },
                                    [
                                        m("label",
                                            "When would you like your DropOff?"
                                        ),
                                        m("br"),

                                        m("div", {
                                            "class": "btn-group btn-group-toggle",
                                            "data-toggle": "buttons"
                                        },
                                            [
                                                dayRangeCalculator(vnode.state.pickupDay)
                                                    .map((time) => {
                                                        const { dayName, day, nth, date } = time
                                                        return m("label", { "class": `btn btn-info ${dropOffDay === date.format('L') ? "focus active" : ""}` },
                                                            [
                                                                m("input", {
                                                                    "type": "radio",
                                                                    "name": "dropOffDay",
                                                                    "id": dropOffDay,
                                                                    "checked": dropOffDay === date.format('L') ? true : false,
                                                                    disabled: moment(vnode.state.pickupDay).day() == 0,
                                                                    onchange: () => {
                                                                        vnode.state.dropOffDay = date.format('L')
                                                                    }
                                                                }),
                                                                dayName + " " + day + nth
                                                            ]
                                                        )
                                                    }),
                                            ]
                                        )
                                    ]
                                ),
                                m("div", { "class": "col-lg-2 col-md-4 col-sm-4" },
                                    [
                                        m("label",
                                            "Time of DropOff:"
                                        ),
                                        m("div", { "class": "dropdown" },
                                            [
                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                    dropOffTime
                                                ),
                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                    [
                                                        operationTimes.map(time => {
                                                            return m("a", {
                                                                style: { "z-index": 10000 },
                                                                onclick(e) {
                                                                    vnode.state.dropOffTime = time
                                                                    e.preventDefault()
                                                                },
                                                                "class": "dropdown-item",
                                                            },
                                                                time
                                                            )
                                                        })
                                                    ]
                                                )
                                            ]
                                        )
                                    ]),

                                !vnode.state.isInternaluser ? [] : m("div", { "class": "col-lg-6" },
                                    [
                                        m("label",
                                            "What the name of the client?"
                                        ),
                                        m("div", { "class": "input-group" },
                                            [
                                                m("input", {
                                                    oninput: (e) => {
                                                        vnode.state.clientName = e.target.value
                                                    },
                                                    value: clientName,
                                                    "class": "form-control",
                                                    "type": "text",
                                                    "placeholder": "ie Jane Doe"
                                                }),
                                                m("div", { "class": "input-group-append" },
                                                    m("span", { "class": "input-group-text" },
                                                        m("i", { "class": "la la-align-center" })
                                                    )
                                                )
                                            ]
                                        ),
                                        m("span", { "class": "form-text text-muted" },
                                            "The name will be used for messaging"
                                        )
                                    ]
                                ),

                                m("div", { "class": "col-lg-6" },
                                    [
                                        m("label",
                                            "What phone number can we reach you on?"
                                        ),
                                        m("div", { "class": "input-group" },
                                            [
                                                m("input", {
                                                    oninput: (e) => {
                                                        vnode.state.phone = e.target.value
                                                    },
                                                    value: phone,
                                                    "class": "form-control",
                                                    "type": "text",
                                                    "placeholder": "ie 07...."
                                                }),
                                                m("div", { "class": "input-group-append" },
                                                    m("span", { "class": "input-group-text" },
                                                        m("i", { "class": "la la-align-center" })
                                                    )
                                                )
                                            ]
                                        ),
                                        // m("span", { "class": "form-text text-muted" },
                                        //     "The phone number that will be used for messaging"
                                        // )
                                    ]
                                ),

                                m("div", { "class": "col-lg-12" },
                                    m("div", { "class": "form-group mb-1" },
                                        [
                                            m("label", { "for": "exampleTextarea" },
                                                "Any more details you would like us to know about the pickup and dropoff?"
                                            ),
                                            m("textarea", {
                                                oninput: (e) => {
                                                    vnode.state.moreDetails = e.target.value
                                                },
                                                value: moreDetails,
                                                "class": "form-control",
                                                "id": "exampleTextarea",
                                                "rows": "12",
                                                "spellcheck": "true"
                                            })
                                        ]
                                    )
                                ),
                                m("br"),
                                m("br"),
                            ]
                        ),



                        m("div", { "class": "bs-stepper" },
                            [
                                m("div", { "class": "bs-stepper-header", "role": "tablist" },
                                    [
                                        m("div", { "class": "step", "data-target": "#logins-part" },
                                            m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "logins-part", "id": "logins-part-trigger" },
                                                [
                                                    m("span", { "class": "bs-stepper-circle" },
                                                        "2"
                                                    ),
                                                    m("span", { "class": "bs-stepper-label" },
                                                        "Laundry service Status"
                                                    )
                                                ]
                                            )
                                        )]
                                )]
                        ),


                        m("div", { "class": "alert alert-custom alert-default", "role": "alert" },
                            [
                                m("div", { "class": "alert-icon" },
                                    m("span", { "class": "svg-icon svg-icon-primary svg-icon-xl" },
                                        m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                            m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                [
                                                    m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                    m("path", { "d": "M7.07744993,12.3040451 C7.72444571,13.0716094 8.54044565,13.6920474 9.46808594,14.1079953 L5,23 L4.5,18 L7.07744993,12.3040451 Z M14.5865511,14.2597864 C15.5319561,13.9019016 16.375416,13.3366121 17.0614026,12.6194459 L19.5,18 L19,23 L14.5865511,14.2597864 Z M12,3.55271368e-14 C12.8284271,3.53749572e-14 13.5,0.671572875 13.5,1.5 L13.5,4 L10.5,4 L10.5,1.5 C10.5,0.671572875 11.1715729,3.56793164e-14 12,3.55271368e-14 Z", "fill": "#000000", "opacity": "0.3" }),
                                                    m("path", { "d": "M12,10 C13.1045695,10 14,9.1045695 14,8 C14,6.8954305 13.1045695,6 12,6 C10.8954305,6 10,6.8954305 10,8 C10,9.1045695 10.8954305,10 12,10 Z M12,13 C9.23857625,13 7,10.7614237 7,8 C7,5.23857625 9.23857625,3 12,3 C14.7614237,3 17,5.23857625 17,8 C17,10.7614237 14.7614237,13 12,13 Z", "fill": "#000000", "fill-rule": "nonzero" })
                                                ]
                                            )
                                        )
                                    )
                                ),
                                m("div", { "class": "alert-text" },
                                    [
                                        "AWAITING PICKUP...,",
                                        m("code",
                                            "Please wait... you might recieve a call from our team member")
                                    ]
                                )
                            ]
                        ),

                        m("div", { "class": "form-group row", style: { "padding": "10px" } },
                            [

                                // m("div", { "class": "col-lg-12" },
                                //     [

                                m("div", {
                                    class: "float-right",
                                    // style: {
                                    //     "padding": "30px"
                                    // }
                                }, [
                                    m("button", {
                                        type: "button",
                                        "class": "btn btn-sm btn-info",
                                        onclick() {

                                            // alert("saving order")


                                            vnode.state.saved = true
                                            vnode.state.updateOrderOnServer(() => {
                                                vnode.state.activeOrderId = null


                                                var {
                                                    //    appartmentName,
                                                    //   houseNumber,
                                                    moreDetails,
                                                    phone,
                                                    name,
                                                    clientName
                                                } = vnode.state

                                                let order = Object.assign({
                                                    //  appartmentName,
                                                    // houseNumber,
                                                    moreDetails,
                                                    phone,
                                                    name,
                                                    clientName
                                                }, {
                                                    googleId: localStorage.getItem('googleId'),
                                                    userId: localStorage.getItem('googleId'),
                                                });

                                                localStorage.removeItem("activeOrderId")
                                                localStorage.setItem("activeOrder", JSON.stringify(order))
                                                vnode.state.clearInternalActiveOrderId()
                                                location.reload()

                                            });

                                        }
                                    }, [
                                        m("i", { "class": "flaticon2-mail-1" }),
                                        m("span", "Save My order"
                                        )

                                    ]),
                                ]),
                                // ])


                            ]),

                        m(map),


                    ]
                ),





                // order ends here 

            )
        }
    }
}



export default calculator