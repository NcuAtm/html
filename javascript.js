
let A={
    "temp":[],
    "rh"  :[],
    "pm2_5":[],
    "co2":[],
    "receive_time" :[]
}

function FetchData(w_id, time_format = 'epoch', amount = '30', variable = 'all', functionality = 'unit') {
    this.w_id = w_id;
    this.time_format = time_format;
    this.amount = amount;
    this.variable = variable;
    this.functionality = functionality;
    this.data = [];
    this.base_url = {
        'unit': '/data_api/latest_x_units/',
        'day': '/data_api/latest_x_days/',
        'time': '/data_api/time_sequence/'
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
}

function data_(data){
    for(let i=0;i<data.length;i++){
            temp=data[i].temp
            rh=data[i].rh
            pm2_5=data[i].pm2_5
            co2=data[i].co2
            receive_time=data[i].receive_time
            if(i==0){

                document.getElementById("temp").innerHTML=temp
                document.getElementById("rh").innerHTML=rh
                document.getElementById("pm2_5").innerHTML=pm2_5
                document.getElementById("co2").innerHTML=co2
                if(co2<1000){ 
                    document.getElementById("co2_color").innerHTML='<i class="far fa-smile fa-8x" style="color:rgb(4, 233, 23);"></i>'
                    }
                else{
                    document.getElementById("co2_color").innerHTML='<i class="far fa-dizzy fa-8x" style="color:rgb(255, 154, 4);"></i>'
                    }

                if(pm2_5<35){
                    //document.getElementById("pm2_5_color").style.color="rgb(4, 219, 69)"
                    document.getElementById("pm2_5_color").innerHTML='<i class="far fa-smile fa-8x" style="color:rgb(4, 233, 23);"></i>'
                    }
                else if(pm2_5>=35 && pm2_5<53) {
                    //document.getElementById("pm2_5_color").style.color="rgb(255, 154, 4)"
                    document.getElementById("pm2_5_color").innerHTML='<i class="far fa-fromn-open fa-8x" style="color:rgb(255, 154, 4);"></i>'
                    }
                else{
                    //document.getElementById("pm2_5_color").style.color = "rgb(235, 48, 1)"
                    document.getElementById("pm2_5_color").innerHTML='<i class="far fa-angry fa-8x" style="color:rgb(235, 48, 1);"></i>'
                    }
            }
            if(i==1){
                if(pm2_5>A.pm2_5[0]){
                    document.getElementById("pm2_5_rise_fall_icon").innerHTML='<span><i class=" card_header_icon fas fa-angle-double-up fa-1x" style="color:rgb(235, 48, 1);"></i></span>;'                  
                }
                else if(pm2_5<A.pm2_5[0]){
                    document.getElementById("pm2_5_rise_fall_icon").innerHTML='<span><i class=" card_header_icon fas fa-angle-double-down fa-1x" style="rgb(4, 219, 69);"></i></span>;'                   
                }
                else{
                    document.getElementById("pm2_5_rise_fall_icon").innerHTML=""
                }
                
                break;
            }

        A.temp.push(temp);
        A.rh.push(rh);
        A.pm2_5.push(pm2_5);
        A.co2.push(co2);
        A.receive_time.push(receive_time); 
    }

}

function FetchDataLinearChart(fetch_data, dom, variable) {
    this.variable = variable;
    this.dom = dom;
    this.fetch_data = fetch_data;
    //this.fetch_data.variable = this.variable;
    this.chart = NaN;
    this.svg_dom = NaN;

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
    this.create = function(fetch_data, dom, variable, t = 'linear') {
        let fetch_data_chart = new this.chart_cate[t](fetch_data, dom, variable);
        this.list.push(fetch_data_chart);
        return fetch_data_chart;
    }
}


let fetch_data_factory = new FetchDataFactory();
let fetch_data_chart_factory = new FetchDataChartFactory();

$(document).ready(function(){
    for (aerobox of document.getElementsByClassName('aerobox-control-area')){
        let d = fetch_data_factory.create(aerobox.id, 'epoch', '30', 'all');   //改變 30筆 想說順便畫圖

    }
});

$('.dropdown-menu a').click(function(){
    $('#aeroboxDropDownBtn').text($(this).text());
    for (fetch_data of fetch_data_factory.list){
        if (fetch_data.w_id == this.id){
            data_(fetch_data.data);  
            document.getElementById("aeroboxDropDownBtn").setAttribute("aerobox-attribute",this.id);

            let b=["pm2_5","co2","temp","rh"]; //畫圖
            for(var_ in b){
                let g=fetch_data_chart_factory.create(fetch_data,`#${b[var_]}Chart`,b[var_]);
                g.dom_init();
            }           
        }
    }
});

//改變處 畫圖&比較上一分鐘決定要不要出現上升/下降箭頭  -->function data_() i==1





