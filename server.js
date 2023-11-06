const os = require('os'); //获取系统内存
const child_process = require('child_process'); //提供系统命令行服务
const http = require('http'); //http请求服务
const fs = require('fs'); //提供服务器读取html、css、js文件的能力



// 获取内存
// (单位,保留几位小数)
//返回：[总内存，剩余内存]
function getMemory(unit, n) {

	let capitalization_unit = unit.toUpperCase();
	let free = os.totalmem();
	let total = os.freemem();
	let free_1 = 0;
	let total_1 = 0;

	//判断单位
	switch (capitalization_unit) {
		case 'MB':
			free_1 = free / Math.pow(1024, 2);
			total_1 = total / Math.pow(1024, 2);
			break;
		case 'GB':
			free_1 = free / Math.pow(1024, 3);
			total_1 = total / Math.pow(1024, 3);
			break;
		case 'TB':
			free_1 = free / Math.pow(1024, 4);
			total_1 = total / Math.pow(1024, 4);
			break;
	}

	//四舍五入
	let free_2 = Number(free_1.toFixed(n));
	let total_2 = Number(total_1.toFixed(n));

	return [free_2, total_2];
}





// 获取CPU的占用率
async function getCpu() {
	let promise = await new Promise(resolve => {

		// (回调函数,是否是剩余的)
		let cpu = 0;

		function getCPUUsage(callback, free) {
			var stats1 = getCPUInfo();
			var startIdle = stats1.idle;
			var startTotal = stats1.total;

			setTimeout(function() {
				var stats2 = getCPUInfo();
				var endIdle = stats2.idle;
				var endTotal = stats2.total;


				var idle = endIdle - startIdle;
				var total = endTotal - startTotal;
				var perc = idle / total;
				if (free === true)
					callback(perc);
				else
					callback((1 - perc));
			}, 1000);
		}


		function getCPUInfo(callback) {
			var cpus = os.cpus();
			var user = 0;
			var nice = 0;
			var sys = 0;
			var idle = 0;
			var irq = 0;
			var total = 0;
			for (var cpu in cpus) {
				user += cpus[cpu].times.user;
				nice += cpus[cpu].times.nice;
				sys += cpus[cpu].times.sys;
				irq += cpus[cpu].times.irq;
				idle += cpus[cpu].times.idle;
			}
			var total = user + nice + sys + idle + irq;
			return {
				'idle': idle,
				'total': total
			};
		}

		function ss(s) {
			let h = s * 100;
			let v = Number(h.toFixed(1));
			cpu = v;

			resolve(cpu);
		}
		getCPUUsage(ss, false);
	})
	return promise;
}







//获取磁盘空间
// (单位,保留几位小数)
async function getDisk(unit, n) {
	let promise = await new Promise(resolve => {
		let capitalization_unit = unit.toUpperCase();
		let free = 0;
		let total = 0;
		child_process.exec('wmic LogicalDisk where DriveType=3 get FreeSpace,Size  /format:list', {
			cwd: ''
		}, (error, stdout, stderr) => {
			if (error) return;
			var aLines = stdout.split('\r\r\n');
			var sFreeSpace = 0,
				sSize = 0;
			for (var i = 0; i < aLines.length; i++) {
				if (aLines[i] != '') {
					var aTokens = aLines[i].split('=');
					switch (aTokens[0]) {
						case 'FreeSpace':
							sFreeSpace += Number(aTokens[1]);
							break;
						case 'Size':
							sSize += Number(aTokens[1]);
							break;
					}
				}
			}
			//判断单位
			switch (capitalization_unit) {
				case 'MB':
					free = sFreeSpace / Math.pow(1024, 2);
					total = sSize / Math.pow(1024, 2);
					break;
				case 'GB':
					free = sFreeSpace / Math.pow(1024, 3);
					total = sSize / Math.pow(1024, 3);
					break;
				case 'TB':
					free = sFreeSpace / Math.pow(1024, 4);
					total = sSize / Math.pow(1024, 4);
					break;
			}
			//四舍五入
			let free_2 = Number(free.toFixed(n));
			let total_2 = Number(total.toFixed(n));
			resolve([free_2, total_2]);
		})
	})
	return promise;
}


//获取GPU占用率
async function getGpu() {
	return new Promise(resolve => {
		child_process.exec('nvidia-smi -q -d UTILIZATION', {
			cwd: ''
		}, (error, stdout, stderr) => {
			if (error) return;
			let a = stdout.split('\r\n').find(s => s.indexOf('Gpu') >= 0 && s.indexOf('%') >= 0)
			let ss = a.split(":");
			// 去除百分号
			var reg1 = new RegExp("%", "g");
			var sss = ss[1].replace(reg1, "");
			resolve(Number(sss));
		})
	})
}



// 创建HTTP服务器
const server = http.createServer((req, res) => {
	//提取url中的路径
	let {
		pathname
	} = new URL(req.url, 'http://127.0.0.1');
	//拼接出完整的路径
	let filePath = __dirname + "/pages" + pathname;


	if (pathname == "/data") {
		// 设置响应头的Content-Type为text/event-stream，表示服务器将发送SSE事件
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');


		// 每隔二秒发送一条消息
		let interval = setInterval(() => {

			let Memory = getMemory("GB", 1);
			async function main() {
				const [cpu, disk, gpu] = await Promise.all([getCpu(), getDisk('GB', 2), getGpu()]);
				let data = {
					Memory,
					cpu,
					disk,
					gpu
				}
				const message = JSON.stringify(data);
				res.write(`data: ${message}\n\n`);
			}
			main();
		}, 1000);

		// 当前请求关闭时触发：
		req.on('close', () => {
			res.end();
			clearInterval(interval);
		});
		


	} else {
		filePath = __dirname + "/pages/index" + pathname;
		fs.readFile(filePath, (err, data) => {
			if (err) {
				res.setHeader('content-type', 'text/html;charset=utf-8');
				res.statusCode = 500;
				res.end('文件读取失败~~');
				return;
			}
			res.end(data);
		});
	}
});




// 监听在8081端口上
server.listen(8081, () => {
	console.log("入口地址：");
	console.log("127.0.0.1:8081/index.html");
});
