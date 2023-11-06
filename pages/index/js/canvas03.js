var chartDom = document.getElementById('canvas03');
console.log(chartDom);
var myChart03 = echarts.init(chartDom);
var option3;

option3 = {
	series: [{
		type: 'gauge',
		radius:"100%",
		min: 0,
		max: 100,
		axisLine: {
			lineStyle: {
				width: 50,
				color: [
					[0.25, '#52C41A'],
					[0.5, '#006EFF'],
					[0.75, '#F6A328'],
					[1, '#FF0F1F']
				]
			}
		},
		pointer: {
			itemStyle: {
				color: 'auto'
			}
		},
		axisTick: {
			distance: -10,
			length: 10,
			lineStyle: {
				color: '#fff',
				width: 2
			}
		},
		splitLine: {
			distance: -30,
			length: 30,
			lineStyle: {
				color: '#fff',
				width: 3
			}
		},
		axisLabel: {
			color: 'inherit',
			distance: 60,
			fontSize: 24
		},
		detail: {
			valueAnimation: true,
			formatter: '{value} %',
			fontSize: 48,
			color: 'inherit'
		},
		data: [{
			value: 10
		}]
	}]
};


myChart03.setOption(option3);
