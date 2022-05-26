import {
    url
} from "../constants"
import axios from "axios";
import m from "mithril"
import {
    timeLimit,
    timeTypeDay,
    timeTypeHr
} from "../constants"
import uploader from "../components/uploader"

const order_item = {
    oninit(vnode) {
        vnode.state.jobs = []
    },
    oncreate(vnode) {
        const options = {
            method: 'GET',
            url: url + "/jobs/" + vnode.attrs.job,
            headers: {
                'Content-Type': 'application/json',
                'authorization': localStorage.getItem('token')
            },
        };

        axios.request(options).then(function (response) {
            vnode.state.jobs = [response.data]
            m.redraw()
        }).catch(function (error) {
            console.error(error);
        });
    },
    view(vnode) {
        return [


            m("div", { "class": "card-body pt-0 pb-4" },
                // content id
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
                                        m("tbody",
                                            [
                                                vnode.state.jobs.map(({
                                                    _id,
                                                    hrs,
                                                    days,
                                                    pages,
                                                    words,
                                                    sources,
                                                    powerpoints,
                                                    price,
                                                    timeLimit,
                                                    writerType,
                                                    contentLimit,
                                                    paymentsType,
                                                    academicLevel,
                                                    spacingType,
                                                    articleType,
                                                    articleLevel,
                                                    paperFormat,
                                                    subjectArea = { type: "Any", points: 1 },
                                                    title,
                                                    instructions,
                                                    paid
                                                }) => {
                                                    return m("tr", {
                                                        style: { "cursor": "pointer" }, onclick() {
                                                            m.route.set("/joblist/" + _id)
                                                        }
                                                    },
                                                        [
                                                            // m("td", { "class": "pl-0 py-5" },
                                                            //     m("div", { "class": "symbol symbol-45 symbol-light mr-2" },
                                                            //         m("span", { "class": "symbol-label" },
                                                            //             m("img", { "class": "h-50 align-self-center", "src": "assets/media/svg/misc/015-telegram.svg", "alt": "" })
                                                            //         )
                                                            //     )
                                                            // ),
                                                            m("td", { "class": "pl-0" },
                                                                [
                                                                    m("span", { "class": "text-dark-75 font-weight-bolder text-hover-primary mb-1 font-size-lg", style: "white-space: nowrap;" },
                                                                        title
                                                                    ),
                                                                    m("div",
                                                                        [
                                                                            m("span", { "class": "font-weight-bolder text-dark-75" },
                                                                                "Subject:", [m("span", { "class": "text-muted font-weight-bold text-hover-primary", style: "white-space: nowrap;", },
                                                                                    " " + subjectArea && subjectArea.type
                                                                                )]
                                                                            )
                                                                        ]
                                                                    )
                                                                ]
                                                            ),
                                                            (!price && !paid) ? null : m("td", { "class": "text-right", style: "white-space: nowrap;", onclick() { m.route.set("/joblist/" + _id) } },
                                                                [
                                                                    m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                        `$${price}`
                                                                    ),
                                                                    m("span", { "class": "text-muted font-weight-bold" },
                                                                        paid ? "Paid" : "Not Paid"
                                                                    )
                                                                ]
                                                            ),
                                                            m("td", { "class": "text-right", style: "white-space: nowrap;" },
                                                                [
                                                                    m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg", style: "white-space: nowrap;", },
                                                                        pages, " Pages",
                                                                    ),
                                                                    m("span", { "class": "text-muted font-weight-bold", style: "white-space: nowrap;", },
                                                                        paperFormat
                                                                    )
                                                                ]
                                                            ),
                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", },
                                                                [
                                                                    m("span", { "class": "text-dark-75 font-weight-bolder d-block font-size-lg" },
                                                                        sources, " Sources",
                                                                    ),
                                                                ]
                                                            ),
                                                            m("td", { "class": "text-right font-weight-bold", style: "white-space: nowrap;", },
                                                                m("span", { "class": "text-muted font-weight-500" },
                                                                    timeLimit === timeTypeDay ? `${days} days ` : `${hrs} hrs`
                                                                )
                                                            ),
                                                            m("td", { "class": "text-right", style: "white-space: nowrap;", },
                                                                m("span", { "class": "label label-lg label-light-info label-inline" },
                                                                    academicLevel
                                                                )
                                                            ),

                                                            m("td", { "class": "text-right pr-0", style: "white-space: nowrap;" },
                                                                [

                                                                    // m("a", { "class": "btn btn-icon btn-light btn-hover-primary btn-sm mx-3", "href": "#" },
                                                                    //     m("span", { "class": "svg-icon svg-icon-md svg-icon-primary" },
                                                                    //         m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                                    //             m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                                    //                 [
                                                                    //                     m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                                    //                     m("path", { "d": "M12.2674799,18.2323597 L12.0084872,5.45852451 C12.0004303,5.06114792 12.1504154,4.6768183 12.4255037,4.38993949 L15.0030167,1.70195304 L17.5910752,4.40093695 C17.8599071,4.6812911 18.0095067,5.05499603 18.0083938,5.44341307 L17.9718262,18.2062508 C17.9694575,19.0329966 17.2985816,19.701953 16.4718324,19.701953 L13.7671717,19.701953 C12.9505952,19.701953 12.2840328,19.0487684 12.2674799,18.2323597 Z", "fill": "#000000", "fill-rule": "nonzero", "transform": "translate(14.701953, 10.701953) rotate(-135.000000) translate(-14.701953, -10.701953)" }),
                                                                    //                     m("path", { "d": "M12.9,2 C13.4522847,2 13.9,2.44771525 13.9,3 C13.9,3.55228475 13.4522847,4 12.9,4 L6,4 C4.8954305,4 4,4.8954305 4,6 L4,18 C4,19.1045695 4.8954305,20 6,20 L18,20 C19.1045695,20 20,19.1045695 20,18 L20,13 C20,12.4477153 20.4477153,12 21,12 C21.5522847,12 22,12.4477153 22,13 L22,18 C22,20.209139 20.209139,22 18,22 L6,22 C3.790861,22 2,20.209139 2,18 L2,6 C2,3.790861 3.790861,2 6,2 L12.9,2 Z", "fill": "#000000", "fill-rule": "nonzero", "opacity": "0.3" })
                                                                    //                 ]
                                                                    //             )
                                                                    //         )
                                                                    //     )
                                                                    // ),
                                                                    m("a", {
                                                                        "class": "btn btn-icon btn-light btn-hover-primary btn-sm", "href": "#", onclick() {
                                                                            const options = {
                                                                                method: 'DELETE',
                                                                                url: `${url}/jobs/${_id}`,
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                    'authorization': localStorage.getItem('token')
                                                                                },
                                                                            };

                                                                            axios.request(options).then(function (response) {
                                                                                console.log(response.data);
                                                                                m.route.set("/joblist")
                                                                                location.reload()
                                                                            }).catch(function (error) {
                                                                                console.error(error);
                                                                            });
                                                                        }
                                                                    },
                                                                        m("span", { "class": "svg-icon svg-icon-md svg-icon-primary" },
                                                                            m("svg", { "xmlns": "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink", "width": "24px", "height": "24px", "viewBox": "0 0 24 24", "version": "1.1" },
                                                                                m("g", { "stroke": "none", "stroke-width": "1", "fill": "none", "fill-rule": "evenodd" },
                                                                                    [
                                                                                        m("rect", { "x": "0", "y": "0", "width": "24", "height": "24" }),
                                                                                        m("path", { "d": "M6,8 L6,20.5 C6,21.3284271 6.67157288,22 7.5,22 L16.5,22 C17.3284271,22 18,21.3284271 18,20.5 L18,8 L6,8 Z", "fill": "#000000", "fill-rule": "nonzero" }),
                                                                                        m("path", { "d": "M14,4.5 L14,4 C14,3.44771525 13.5522847,3 13,3 L11,3 C10.4477153,3 10,3.44771525 10,4 L10,4.5 L5.5,4.5 C5.22385763,4.5 5,4.72385763 5,5 L5,5.5 C5,5.77614237 5.22385763,6 5.5,6 L18.5,6 C18.7761424,6 19,5.77614237 19,5.5 L19,5 C19,4.72385763 18.7761424,4.5 18.5,4.5 L14,4.5 Z", "fill": "#000000", "opacity": "0.3" })
                                                                                    ]
                                                                                )
                                                                            )
                                                                        )
                                                                    )
                                                                ]
                                                            )
                                                        ]
                                                    )
                                                })
                                            ]
                                        )
                                    ]
                                )
                            )
                        )
                    ]
                )
            ),



            m("div", { "class": "card card-custom gutter-b" },
                [

                    m("div", { "class": "card-body pt-0 pb-4" },
                        // content id
                        m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                            [

                                m("div", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                    [
                                        vnode.state.jobs.map(job => job.instructions)
                                    ]
                                ),
                            ]
                        )
                    ),

                ]
            ),

            m("div", { "class": "card card-custom gutter-b" },
                [
                    m("div", { "class": "card-header border-0 pt-7" },
                        [
                            m("h3", { "class": "card-title align-items-start flex-column" },
                                [
                                    m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                        "Attatched Documents"
                                    ),
                                    // m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
                                    //     "More than 400+ new members"
                                    // )
                                ]
                            )
                        ]
                    ),
                    m("div", { "class": "card-body pt-0 pb-4" },
                        // content id
                        m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                            [

                                m("div", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                    vnode.state.jobs[0] && (vnode.state.jobs[0].additional_material_1 || vnode.state.jobs[0].additional_material_2 || vnode.state.jobs[0].additional_material_3) ? [
                                        vnode.state.jobs[0].additional_material_1 ? m("a", { href: vnode.state.jobs[0].additional_material_1 }, `Download Attatchment 1`) : [],
                                        vnode.state.jobs[0].additional_material_2 ? m("a", { href: vnode.state.jobs[0].additional_material_2 }, `Download Attatchment 2`) : [],
                                        vnode.state.jobs[0].additional_material_3 ? m("a", { href: vnode.state.jobs[0].additional_material_3 }, `Download Attatchment 3`) : [],
                                    ] : []
                                ),
                            ]
                        )
                    )
                ]
            ),

            m(".row", [
                m(".col-lg-3", [
                    m("div", { "class": "card card-custom gutter-b" },
                        [

                            m("div", { "class": "card-body pt-0 pb-4" },
                                // content id
                                !vnode.state.jobs[0] ? null : [
                                    m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                                        [
                                            m("div", [
                                                m("button", {
                                                    "class": "btn btn-primary btn-lg btn-block",
                                                    "type": "button",
                                                    disabled: vnode.state.jobs[0].assigned_to,
                                                    onclick() {
                                                        const options = {
                                                            method: 'PATCH',
                                                            url: url + `/jobs/${vnode.state.jobs[0]._id}`,
                                                            headers: { 'Content-Type': 'application/json' },
                                                            data: {
                                                                assigned_to: {
                                                                    id: localStorage.getItem("authToken"),
                                                                    name: localStorage.getItem("name")
                                                                }
                                                            }
                                                        };

                                                        axios.request(options).then(function (response) {
                                                            console.log(response.data);
                                                            location.reload()
                                                        }).catch(function (error) {
                                                            console.error(error);
                                                        });
                                                    }
                                                },
                                                    vnode.state.jobs[0].assigned_to ? "Assigned to " + vnode.state.jobs[0].assigned_to.name : "Assign Job to yourself"
                                                )
                                            ])
                                        ]
                                    ),
                                    !vnode.state.jobs[0].completed_upload ? null : m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                                        [
                                            m("div", [
                                                m("button", { 
                                                    "class": "btn btn-primary btn-lg btn-block", "type": "button",
                                                    disabled: vnode.state.jobs[0].ready_for_review,
                                                    onclick() {
                                                        const options = {
                                                            method: 'PATCH',
                                                            url: url + `/jobs/${vnode.state.jobs[0]._id}`,
                                                            headers: { 'Content-Type': 'application/json' },
                                                            data: {
                                                                ready_for_review: true
                                                            }
                                                        };

                                                        axios.request(options).then(function (response) {
                                                            console.log(response.data);
                                                            location.reload()
                                                        }).catch(function (error) {
                                                            console.error(error);
                                                        });
                                                    }
                                                },
                                                    vnode.state.jobs[0].ready_for_review ? "Job is Submited for review" : "Job is Ready for Review"
                                                )
                                            ])
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]),
                vnode.state.jobs[0] && vnode.state.jobs[0].assigned_to && [vnode.state.jobs[0].assigned_to.id !== localStorage.getItem("authToken")  ? []  :  m(".col-lg-9", [
                    m("div", { "class": "card card-custom gutter-b" },
                        [
                            m("div", { "class": "card-header border-0 pt-7" },
                                [
                                    m("h3", { "class": "card-title align-items-start flex-column" },
                                        [
                                            m("span", { "class": "card-label font-weight-bold font-size-h4 text-dark-75" },
                                                "Upload Compleated Work"
                                            ),
                                            // m("span", { "class": "text-muted mt-3 font-weight-bold font-size-sm" },
                                            //     "More than 400+ new members"
                                            // )
                                        ]
                                    )
                                ]
                            ),
                            m("div", { "class": "card-body pt-0 pb-4" },
                                // content id
                                m("div", { "class": "card-body d-flex align-items-center py-5 py-lg-13" },
                                    [

                                        m("div", { "class": "m-0 text-dark-50 font-weight-bold font-size-lg" },
                                            [
                                                m("div", { "class": "form-group" },
                                                    [
                                                        m("label",
                                                            "Compleated Work"
                                                        ),
                                                        m("div"),
                                                        m(uploader, {
                                                            jobID: vnode.attrs.job,
                                                            job: vnode.state.jobs[0],
                                                            field: "completed_upload"
                                                        })
                                                    ]
                                                ),
                                                m("div", { "class": "form-group" },
                                                    [
                                                        m("label",
                                                            "Plaegerism Report"
                                                        ),
                                                        m("div"),
                                                        m(uploader, {
                                                            jobID: vnode.attrs.job,
                                                            job: vnode.state.jobs[0],
                                                            field: "plaegerism_upload"
                                                        })
                                                    ]
                                                )
                                            ]
                                        ),
                                    ]
                                )
                            ),

                        ]
                    )
                ])]
            ]),
        ]
    }
}

export default order_item