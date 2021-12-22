function redirectNewLink(currentUrl,CONSTANT) {
	let {redirectUrl} = CONSTANT;
	let newUrl;
	return new Promise(async resolve => {
		try {
			redirectUrl.find(url=>{
				if(url.oldUrl === currentUrl){
					newUrl = url.newUrl;
					return resolve({ error: false, data: newUrl });
				}
			})
			return resolve({ error: false, data:undefined});
		} catch (error) {
			return resolve({ error: true, message: error.message });
		}
	})
	
}

module.exports = { redirectNewLink };