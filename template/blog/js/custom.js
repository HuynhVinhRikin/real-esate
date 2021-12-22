

const listKey = [
	{
		type:'user',
		shortcode:'listuserblogfemale'
	},
	{
		type:'user',
		shortcode:'listuserblogmale'
	},
	{
		type:'user',
		shortcode:'listuserblogfemalehcm'
	},
	{
		type:'user',
		shortcode:'listuserblogmalehcm'
	},
	{
		type:'concept',
		shortcode:'listconcepthuyen'
	},
	{
		type:'concept',
		shortcode:'listconceptoanh'
	},
]
function TableContent(){

	setTimeout(function(){
		$("#toc").toc({content: "#content-blog", headings: "h2,h3,h4"});
		$('.ez-toc-list').slideUp();

		$('.ez-toc-title-toggle').on('click',function(){
			$('.ez-toc-list').slideToggle();
		});
	}, 1000);
}
function dropdownClick() {
	var $userDropdownBtn = $('.wao-topbar__btn-user');
	var $notificationDropdownBtn = $('.wao-topbar__dropdown-toggle-notification');

	$userDropdownBtn.on('click', function () {
		$(this).toggleClass('wao-topbar__btn-user--active');
		$('.wao-topbar__notification').removeClass('wao-topbar__notification--active');
		$('.wao-topbar__dropdown-account').toggleClass('wao-topbar__dropdown--show');
		$('.wao-topbar__dropdown-notification').removeClass('wao-topbar__dropdown--show');
	});

	$notificationDropdownBtn.on('click', function () {
		$('.wao-topbar__notification').toggleClass('wao-topbar__notification--active');
		$userDropdownBtn.removeClass('wao-topbar__btn-user--active');
		$('.wao-topbar__dropdown-notification').toggleClass('wao-topbar__dropdown--show');
		$('.wao-topbar__dropdown-account').removeClass('wao-topbar__dropdown--show');
	});
}

function  createListUserGender(obj){
	var itemAll = ``;

	var items=[];
	function itemUser(data) {
		return `
		<div class="col-lg-4 col-sm-6 mb-20">
			<div class="top-user-blog-item">
				<div class="top-user-blog-item__thumbnail">
					<a href="${data.slug}" rel="nofollow" >
						<img src="${data.avatar}" data-src="${data.avatar}"  class="img-responsive lazy" alt="${data.name}" />
					</a>	
				</div>
				<div class="top-user-blog-item__desc">
					<div class="top-user-blog-item__info">
						<p class="top-user-blog-item__name"><a  href="${data.slug}" rel="nofollow">${data.name}</a></p>	
						<p class="top-user-blog-item__age" >${data.age}</p>
						${(data.desc)?'<p class="top-user-blog-item__text">'+data.desc+'</p>':''}
					</div>
				</div>
			</div>
		</div>
		`
	}
	function itemSlidea(data) {
		return `
		<div class="user-blog-item">
			<div class="row">
				${Object.keys(data).map(function(key){
					return itemUser(data[key]);
				}).join("")}
			</div>
		</div>	
		`;
	}
	obj.forEach( (item,index) => {
		items.push(item);
		if( (index+1)%6 == 0  ){
			itemAll += itemSlidea(items);
			items=[];
		}
	});
	if(items.length !== 0){
		itemAll += itemSlidea(items);
	}
	return `
		<div class="owl-carousel owl-theme list-user-blog">
			${itemAll}
		</div>
	`;
}
function  createListConcept(obj){
	function itemUser(data) {
		return `
			<div class="dating-user__item">
				<div class="dating-user__concept">
					<div class="dating-concept__top">
						<div class="dating-concept__image">
							<a href="${data.slug}" rel="nofollow">	
								<img src="${data.avatar}" data-src="${data.avatar}" class="lazy" alt="${data.name}">
							</a>
						</div>
						<div class="dating-concept__title">
							<a href="${data.slug}" rel="nofollow">
								<p class="h3">
									${data.name}
								</p>
							</a>
							
						</div>
					</div>
					<div class="dating-concept__bottom">
						<div class="user-concept__info">
							<ul>
								<li class="user-concept__price"><span class="f-bold">Tổng chi phí : </span>
										<span>${data.totalprice}</span>
								</li>
							</ul>
							<p>
								${data.desc}
								<a href="${data.slug}" style="color:#4e37d3" rel="nofollow">Xem thêm</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		`
	}
	return `
	<div class="owl-carousel owl-theme dating-content">
		${Object.keys(obj).map(function(key){
			return itemUser(obj[key]);
		}).join("")}
	</div>	
	`;
	
}

function callApiUserBlog(user){
	var domain = 'https://waodate.com/get-userblog/'+user.shortcode;
	let re = new RegExp('\\[' + user.shortcode + '\\]',"g");

	return new Promise((res,rej)=>{
		$.ajax({
		url: domain,
		method: 'GET',
		success: function(data) {
			if (user.type == 'user'){
				$("#content-blog").children().each(function(){
					let t = createListUserGender(data);
					$(this).html($(this).html().replace(re,t));
					res();
				});
			}else if(user.type == "concept"){
				$("#content-blog").children().each(function(){
					let t = createListConcept(data);
					$(this).html($(this).html().replace(re,t));
					res();
				});
			}
			
		},
		error: function(err){
			rej(err.message);
		}
	})});
}

async function findKeyInContent(shortCode,content){
	var Promised=[];
	 shortCode.map(
		 (user,index) => {
			if(content.indexOf(`[${user.shortcode}]`) !== -1){
				Promised.push(callApiUserBlog(user));
			}
		}
	)
	Promise.all(Promised).then(()=>{
		
		$('.list-user-blog').owlCarousel({
			loop:true,
			margin:10,
			nav:true,
			items:1,
			navText: ["",""]
		});
		$('.dating-content').owlCarousel({
			loop:true,
			margin:10,
			nav:true,
			items:2,
			navText: ["",""],
			responsive : {
				0:{
					items:1,
					nav:true
				},
				600:{
					items:2,
					nav:true
				},
				1000:{
					items:2,
					nav:true,
				}
			}
		});


	});
}

$(document).ready(function(){
	TableContent();
	$('body').on('click', '.btnLogout', function(e){
		e.preventDefault();
		localStorage.removeItem('token_waodate');
		window.location.href = '/clear-session';
	});
	// callSlider();
	// callApiUserBlog();
	// dropdownClick();
	// var tableContent = `
		
	// `;
	// setTimeout(function(){
	// 	$('#content-blog').find('h2').first().before(tableContent,);
	// 	console.log($('#content-blog').find('h2').length);

	// },1000)
	




	var isBLog = $("#content-blog");
	
	
	if(isBLog.length == 1){
		setTimeout( function(){
			$("#content-blog").children().each(function(){
				var stringContent = $(this).html();
				$(this).html($(this).html().replace(/\[back-to-home\]/g,'<div class="back-to-home"> <a href="https://waodate.com/dang-ky" id="dangki1" rel="nofollow" class="btn-dang-ky" alt="đăng ký"></a></div>'));
				$(this).html($(this).html().replace(/\[back-to-home-2\]/g,'<div class="back-to-home"> <a href="https://waodate.com/dang-ky" id="dangki2"  rel="nofollow" class="btn-dang-ky" alt="đăng ký"></a></div>'));
				
				findKeyInContent(listKey,stringContent);

			})
			
		},200);
	}

	$('.btnSearchMobile').on('click', function(){
		let key = $('.searchform__inputmobile').val();
		return window.location.href = `/blog/?search=${key}`;
	})
	document.addEventListener("DOMContentLoaded", function() {
		let lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));
		let active = false;
	  
		const lazyLoad = function() {
		  if (active === false) {
			active = true;
	  
			setTimeout(function() {
			  lazyImages.forEach(function(lazyImage) {
				if ((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== "none") {
				  lazyImage.src = lazyImage.dataset.src;
				  lazyImage.srcset = lazyImage.dataset.srcset;
				  lazyImage.classList.remove("lazy");
	  
				  lazyImages = lazyImages.filter(function(image) {
					return image !== lazyImage;
				  });
	  
				  if (lazyImages.length === 0) {
					document.removeEventListener("scroll", lazyLoad);
					window.removeEventListener("resize", lazyLoad);
					window.removeEventListener("orientationchange", lazyLoad);
				  }
				}
			  });
	  
			  active = false;
			}, 200);
		  }
		};
	  
		document.addEventListener("scroll", lazyLoad);
		window.addEventListener("resize", lazyLoad);
		window.addEventListener("orientationchange", lazyLoad);
	  });
  });
