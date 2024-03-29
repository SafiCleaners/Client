import m from "mithril"
const steps = () => {
    return {
        view() {
            return m("div", { "class": "bs-stepper d-none d-md-block" },
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
                                            "Fill Out Order Form"
                                        )
                                    ]
                                )
                            ),
                            m("div", { "class": "line" }),
                            m("div", { "class": "step", "data-target": "#information-part" },
                                m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "information-part", "id": "information-part-trigger" },
                                    [
                                        m("span", { "class": "bs-stepper-circle" },
                                            "2"
                                        ),
                                        m("span", { "class": "bs-stepper-label" },
                                            "Rider Picks Up for Free"
                                        )
                                    ]
                                )
                            ),
                            m("div", { "class": "line" }),
                            m("div", { "class": "step", "data-target": "#information-part" },
                                m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "information-part", "id": "information-part-trigger" },
                                    [
                                        m("span", { "class": "bs-stepper-circle" },
                                            "3"
                                        ),
                                        m("span", { "class": "bs-stepper-label" },
                                            "Our Team Executes in ~3hrs"
                                        )
                                    ]
                                )
                            ),
                            m("div", { "class": "line" }),
                            m("div", { "class": "step", "data-target": "#information-part" },
                                m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "information-part", "id": "information-part-trigger" },
                                    [
                                        m("span", { "class": "bs-stepper-circle" },
                                            "4"
                                        ),
                                        m("span", { "class": "bs-stepper-label" },
                                            "Rider Drop Off for free"
                                        )
                                    ]
                                )
                            ),
                            m("div", { "class": "line" }),
                            m("div", { "class": "step", "data-target": "#information-part" },
                                m("button", { "class": "step-trigger", "type": "button", "role": "tab", "aria-controls": "information-part", "id": "information-part-trigger" },
                                    [
                                        m("span", { "class": "bs-stepper-circle" },
                                            "4"
                                        ),
                                        m("span", { "class": "bs-stepper-label" },
                                            "Submit Payment"
                                        )
                                    ]
                                )
                            )
                        ]
                    ),
                    m("div", { "class": "bs-stepper-content" },
                        [
                            m("div", { "class": "content", "id": "logins-part", "role": "tabpanel", "aria-labelledby": "logins-part-trigger" }),
                            m("div", { "class": "content", "id": "information-part", "role": "tabpanel", "aria-labelledby": "information-part-trigger" })
                        ]
                    )
                ]
            )
        }
    }
}

export default steps