import axios from "axios";


import {
    url
} from "../constants"

import m from "mithril"
import loader from "../components/loader"
import addStore from "../components/add_store"
import editStore from "../components/edit_store"

const formatCurrency = (number) => {
    try {
        return Intl.NumberFormat('en-US').format(number);
    } catch (error) {
        console.error('Error formatting number:', error);
        return 'N/A';
    }
}

const stores = {
    oninit(vnode) {
        vnode.state.stores = []
        vnode.state.loading = true
    },
    oncreate(vnode) {
        const getStores = axios.request({
            method: 'GET', 
            url: url + "/stores",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        const getBrands = axios.request({
            method: 'GET',
            url: url + "/brands",
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        });

        Promise.all([getStores, getBrands])
            .then(function (responses) {
                console.log(responses)
                vnode.state.stores = responses[0].data;
                vnode.state.brands = responses[1].data;
                vnode.state.loading = false;
                m.redraw();
            })
            .catch(function (errors) {
                vnode.state.loading = false;
                m.redraw();
                console.error(errors);
            });
    },
    view(vnode) {
        return m("div", { "class": "card card-custom gutter-b" },
            [
                m("div", { "class": "card-header border-0 pt-7" },
                    [
                        m("h3", { "class": "card-title align-items-start flex-column" },
                            [
                                m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                    "Available Stores"
                                ),
                            ]
                        ),
                        m(addStore)
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
                                                        m("th", { "class": "p-0 min-w-200px" }),
                                                        m("th", { "class": "p-0 min-w-150px" }),
                                                        m("th", { "class": "p-0 min-w-50px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-100px" }),
                                                        m("th", { "class": "p-0 min-w-50px" })
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
                                                        m("th", { "class": "p-0 min-w-200px text-left" }, "Title"),
                                                        m("th", { "class": "p-0 min-w-150px text-right" }, "Address"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Phone"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Email"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Added By"),
                                                        m("th", { "class": "p-0 min-w-100px text-right" }, "Date Added"),
                                                        m("th", { "class": "p-0 min-w-50px text-right" }, "Actions")
                                                    ]
                                                )
                                            ),
                                            m("tbody",
                                                [
                                                    vnode.state.stores?.map((item) => {
                                                        return m("tr", {
                                                            style: { "cursor": "pointer" }
                                                        },
                                                            [
                                                                m("td", { "class": "text-left", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.title
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.address
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [

                                                                        m("div", { "class": "dropdown" },
                                                                            [
                                                                                m("button", { "class": "btn btn-secondary dropdown-toggle", "type": "button", "id": "dropdownMenuButton", "data-toggle": "dropdown", "aria-haspopup": "true", "aria-expanded": "false" },
                                                                                    item.brand ? vnode.state.brands?.filter(currentBrand => currentBrand._id === item.brand)[0].title : "Select a Brand:"
                                                                                ),
                                                                                m("div", { "class": "dropdown-menu", "aria-labelledby": "dropdownMenuButton" },
                                                                                    [
                                                                                        vnode.state.brands?.map(brand => {
                                                                                            return m("a", {
                                                                                                style: { "z-index": 10000 },
                                                                                                href: "javascript:void(0);",
                                                                                                onclick() {
                                                                                                    // update db on role change
                                                                                                    // vnode.state.user = e
                                                                                                    const options = {
                                                                                                        method: 'PATCH',
                                                                                                        url: url + `/store/${item._id}`,
                                                                                                        headers: {
                                                                                                            'Content-Type': 'application/json',
                                                                                                            'authorization': localStorage.getItem('token')
                                                                                                        },
                                                                                                        data: { brand: brand._id }
                                                                                                    };

                                                                                                    axios.request(options).then(function (response) {
                                                                                                        console.log(response.data);
                                                                                                        window.location.reload()
                                                                                                    }).catch(function (error) {
                                                                                                        console.error(error);
                                                                                                    });
                                                                                                },
                                                                                                "class": "dropdown-item",
                                                                                            },
                                                                                                brand.title
                                                                                            )
                                                                                        })
                                                                                    ]
                                                                                )
                                                                            ]
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.phone
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.email
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.userTitle
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                    [
                                                                        m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                            item.createdAtFormatted
                                                                        )
                                                                    ]
                                                                ),
                                                                m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                                    m('div', { "class": "" },
                                                                        [
                                                                            m(editStore, { "brand": item }),
                                                                            m('a', {
                                                                                href: "javascript:void(0);",
                                                                                "class": "btn btn-icon btn-light btn-hover-danger btn-sm", onclick() {
                                                                                    const options = {
                                                                                        method: 'DELETE',
                                                                                        url: `${url}/stores/${item._id}`,
                                                                                        headers: {
                                                                                            'Content-Type': 'application/json',
                                                                                            'authorization': localStorage.getItem('token')
                                                                                        },
                                                                                    };

                                                                                    axios.request(options).then(function (response) {
                                                                                        vnode.state.stores = vnode.state.stores.filter(s => s._id != item._id)
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
        )
    }
}

export default stores
