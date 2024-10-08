import m from "mithril"
import axios from "axios";
import google_login from "./google_login"
import {
    url
} from "../constants"

const subheader = () => {
    return {
        oninit(vnode){
            vnode.state.brands = []
        },
        oncreate(vnode) {
            const options = {
                method: 'GET', url: url + "/brands",
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': localStorage.getItem('token')
                },
            };
    
            axios.request(options).then(function (response) {
                vnode.state.brands = response.data
                vnode.state.loading = false
                m.redraw()
            }).catch(function (error) {
                vnode.state.loading = false
                m.redraw()
                console.error(error);
            });
        },
        view(vnode) {
            var brandLogo = vnode.state.brands.find(b=>b._id==localStorage.getItem('brand'))?.logo

            return !["/", "q-new"].includes(m.route.get()) ? [] : m("div", { "class": "subheader bg-white h-100px", "id": "kt_subheader" },
                m("div", { "class": "container flex-wrap flex-sm-nowrap" },
                    [
                        m("div", { "class": "d-none d-lg-flex align-items-center flex-wrap w-300px" },
                            m(m.route.Link, { "href": "/" },
                                m("img", { "class": "max-h-100px", "alt": "Logo", "src": brandLogo ? brandLogo : "/assets/media/exported-wellwash-new.png" })
                            )
                        ),
                        m("div", { "class": "subheader-nav nav flex-grow-1" },
                            [
                                m("a", {
                                    "class": "nav-item",
                                    onclick(e) {
                                        e.preventDefault();
                                    }
                                },
                                    !localStorage.getItem('authToken') ? m("span", { "class": "nav-label px-10" },
                                        [
                                            m("span", { "class": "nav-title text-dark-75 font-weight-bold font-size-h4" },
                                                "Order For Pickup"
                                            ),
                                            m("span", { "class": "nav-desc text-muted" },
                                                "Your Trusted Laundry Service"
                                            )
                                        ]
                                    ) : m("span", { "class": "nav-label px-10" },
                                        [
                                            m(".row", [
                                                m(".col-2.d-block d-md-none", [
                                                    // m("span", { "class": "svg-icon svg-icon-xl" }, [
                                                        m("img", {
                                                            src: localStorage.getItem('imageUrl'),
                                                            style: {
                                                                "max-width": "100%",
                                                                height: "auto",
                                                                "padding-top": "20"
                                                            }
                                                        })
                                                    // ]),
                                                ]),
                                                 m(".col-6", [
                                                    m("span", { "class": "nav-title text-dark-75 font-weight-bold font-size-h4" },
                                                        "Welcome " + localStorage.getItem('name')
                                                    ),
                                                    m("br"),
                                                    m("span", { "class": "nav-desc text-muted" },
                                                        "Order for Laundry Pickup below"
                                                    )
                                                ]),
                                                m(".col-3.d-block d-md-none",[
                                                    m("button", {
                                                        type: "button",
                                                        "class": "btn btn-info btn-sm", 
                                                        onclick() {
                                                            localStorage.clear()
                    
                                                            if(window.gapi.auth2)
                                                                Promise.resolve(window.gapi.auth2.getAuthInstance().signOut()).then(function () {
                                                                    console.log('User signed out.');
                                                                    window.location.reload()
                                                                });
                    
                                                            window.location.reload()
                                                        }
                                                    },
                                                        "SignOut"
                                                    )
                                                ])
                                            ])

                                        ]
                                    )
                                ),
                                localStorage.getItem('authToken') ? [] : m(m.route.Link, { "class": "nav-item active d-md-none" },
                                     m("div", { style: { margin: "auto" } }, [
                                        // m("div", { "id": "g_id_onload2", "data-callback": "handleGoogleCredentialResponse" }),
                                        m(google_login)
                                    ])
                                )
                            ]
                        )
                    ]
                )
            )
        }
    }
}


export default subheader