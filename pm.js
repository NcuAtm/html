var app = new Vue({
    el:"#vue",
    data: {
        "temp":"","rh":"","co2":"","pm2_5":"",
        "temp_icon":"<i class='fas fa-thermometer-quarter fa-8x blue'</i>",
        "rh_icon":"<i class='fas fa-tint fa-8x blue'</i>",
        "co2_icon":"<i class='far fa-smile fa-8x green'</i>",
        "pm2_5_icon":"<i class='far fa-smile fa-8x green'</i>",
        "receive_time":""      
},
    methods: {
        data_ :function(data){
            for (let i = 0; i < data.length; i++) {
                    temp = data[i].temp
                    rh = data[i].rh
                    pm2_5 = data[i].pm2_5
                    co2 = data[i].co2
                    receive_time = new Date(data[i].receive_time)
                    if (i == 0) {
                        this.temp=temp
                        this.rh=rh
                        this.co2=co2
                        this.pm2_5=pm2_5
                        this.receive_time=receive_time
                        if (co2 < 1000) {
                            this.co2_icon="<i class='far fa-smile fa-8x green'</i>"
                        } else {
                            this.co2_icon="<i class='far fa-dizzy fa-8x red'</i>"
                        }

                        if (pm2_5 < 35) {
                            this.pm2_5_icon="<i class='far fa-smile fa-8x green'</i>"
                        } else if (pm2_5 >= 35 && pm2_5 < 53) {
                            this.pm2_5_icon="<i class='far fa-fromn-open fa-8x yellow'</i>"
                        } else {
                            this.pm2_5_icon="<i class='far fa-angry fa-8x red'</i>"
                        }
                        break;
                    }
            }
        }
    }
})


let fetch_data_factory = new FetchDataFactory();
let fetch_data_chart_factory = new FetchDataChartFactory();

$(document).ready(function() {
    let b = ["pm2_5", "co2", "temp", "rh"]; //畫圖
    for (aerobox of document.getElementsByClassName('aerobox-control-area')) {
        let d = fetch_data_factory.create(aerobox.id, 'epoch', '60', 'all');

        for (var_ of b) {
            let g = fetch_data_chart_factory.create(d, `#${var_}Chart`, var_, aerobox.id);
        }
    }
});

$('.dropdown-menu a').click(function() {
    $('#aeroboxDropDownBtn').text($(this).text());
    for (fetch_data of fetch_data_factory.list) {
        if (fetch_data.w_id == this.id) {
            fetch_data.fetch();
            app.data_(fetch_data.data);
            document.getElementById("aeroboxDropDownBtn").setAttribute("aerobox-attribute", this.id);
        }
    }
});

$('.chart-modal').on('shown.bs.modal', function() {
    let current_id = document.getElementById("aeroboxDropDownBtn").getAttribute("aerobox-attribute");
    for (this_chart of fetch_data_chart_factory.list) {
        if (this_chart.w_id == current_id) {
            this_chart.dom_init();
            this_chart.plot_update();
            console.log(this_chart);
        }
    }
});