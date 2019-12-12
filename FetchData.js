var variableColor = {
    'pm2_5': "#993300",
    'pm10': '#000000',
    'co2': "#ff0066",
    'temp': "#ff6600",
    'rh': '#0033cc'
};

var variableUnit = {
    'pm2.5': "pm2_5(μg／m^3)",
    'pm10': 'pm10(μg／m^3)',
    'co2': "CO2(ppm)",
    'temp': "Temp(°C)",
    'rh': 'RH(%)'
};

var variableMax = {
    'pm2_5': 200,
    'pm10': 500,
    'co2': 1500,
    'temp': 40,
    'rh': 30
};

var variableMin = {
    'pm2_5': 0,
    'pm10': 0,
    'co2': 300,
    'temp': 10,
    'rh': 100
};

// let A = {
//     "temp": [],
//     "rh": [],
//     "pm2_5": [],
//     "co2": [],
//     "receive_time": []
// }

function FetchData(w_id, time_format = 'epoch', amount = '30', variable = 'all', functionality = 'unit') {
    this.w_id = w_id;
    this.time_format = time_format;
    this.amount = amount;
    this.variable = variable;
    this.functionality = functionality;
    this.data = [];
    this.base_url = {
        'unit': 'https://testsky.atm.ncu.edu.tw/data_api/latest_x_units/',
        'day': 'https://testsky.atm.ncu.edu.tw/data_api/latest_x_days/',
        'time': 'https://testsky.atm.ncu.edu.tw/data_api/time_sequence/'
    }

    this.get_url = function() {
        let base = this.base_url[this.functionality]
        let parameter = `?w_id=${this.w_id}&f=${this.time_format}&u=${this.amount}&variable=${this.variable}`;
        let url = base + parameter;
        return url;
    }

    this.fetch = function() {
        fetch(this.get_url()).then(response => response.json()).then(data => {
            this.data = data;
        }).catch(function(err) {
            console.log(`${this.url} Error`)
        })
    };
    this.fetch();
}

function FetchDataFactory() {
    this.list = [];
    this.create = function(w_id, time_format = 'epoch', amount = '30', variable = 'all', functionality = 'unit') {
        let fetch_data = new FetchData(w_id, time_format, amount, variable, functionality);
        this.list.push(fetch_data);
        return fetch_data;
    }
    this.fetch_all = function() {
        for (fetch_data of this.list) {
            fetch_data.fetch();
        }
    }
}

function FetchDataLinearChart(fetch_data, dom, variable, w_id) {
    this.variable = variable;
    this.dom = dom;
    this.fetch_data = fetch_data;
    //this.fetch_data.variable = this.variable;
    this.chart = NaN;
    this.svg_dom = NaN;
    this.w_id = w_id

    this.data_serialize = function(d, key, color) {
        let data = d;
        let tData = [];
        for (let datum of data) {
            tData.push({
                x: datum['receive_time'],
                y: parseFloat(datum[key])
            });
        };

        if (key == 'pm2_5') {
            key = 'pm2.5';
        };

        return [{
            values: tData,
            key: key,
            color: color
        }];
    };

    this.chart_init = function(d, yLabel, domainMax, domainMin) {
        chart = nv.models.lineChart()
            .options({
                duration: 300,
                useInteractiveGuideline: true
            });

        // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
        chart.xAxis
            .axisLabel('Time')
            .showMaxMin(false)
            .rotateLabels(-20) // Want longer labels? Try rotating them to fit easier.
            .tickPadding(10)
            .tickFormat(function(d) {
                return d3.time.format('%m/%d %H')(new Date(d));
            })

        chart.yAxis
            .axisLabel(yLabel)
            .ticks(5)
            .tickFormat(function(d) {
                if (d == null) {
                    return 'N/A';
                };
                return d3.format('4.2f')(d);
            });

        //chart.forceY([domainMin,domainMax])
        return chart;
    }

    this.plot = function(Jdata) {
        let variable = this.variable;
        let d = this.data_serialize(Jdata, variable, variableColor[variable]);
        let yLabel = variableUnit[variable];
        let domainMax = variableMax[variable];
        let domainMin = variableMin[variable];
        this.chart = this.chart_init(d, yLabel, domainMax, domainMin);
        this.svg_dom = d3.select(`${this.dom}`).append('svg');
        this.svg_dom.datum(d).transition().duration(500).call(this.chart);
        nv.utils.windowResize(this.chart.update);
    }

    this.dom_init = function() {
        if (this.fetch_data.data.length == 0) {
            this.data_update();
        }
        if ($(`${this.dom}`).length > 0) {
            this.remove_dom();
        }
        this.plot(this.fetch_data.data);
    }

    this.remove_dom = function() {
        d3.selectAll(`${this.dom} svg`).remove();
    }

    this.plot_update = function() {
        this.svg_dom.datum(
                this.data_serialize(this.fetch_data.data, variable, variableColor[variable])
            )
            .transition().duration(500).call(this.chart);
    }

    this.data_update = function() {
        this.fetch_data.fetch();
    }
}

function FetchDataChartFactory() {
    this.chart_cate = {
        'linear': FetchDataLinearChart,
    }
    this.list = [];
    this.create = function(fetch_data, dom, variable, w_id, t = 'linear') {
        let fetch_data_chart = new this.chart_cate[t](fetch_data, dom, variable, w_id);
        this.list.push(fetch_data_chart);
        return fetch_data_chart;
    }
}