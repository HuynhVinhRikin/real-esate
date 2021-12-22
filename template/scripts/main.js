var mediaQueryPc = window.matchMedia("screen and (min-width: 1200px)");

function initEditor(selector, options = {}, cb = null, cbUploadImage = null) {
    tinyMCE.init({
        selector,
        plugins: [
            'advlist autolink lists link image charmap print preview anchor codesample',
            'searchreplace visualblocks code fullscreen quickbars hr nonbreaking pagebreak',
            'insertdatetime media table paste imagetools wordcount emoticons' // formatpainter powerpaste
        ],
        toolbar: 'undo redo | styleselect | bold italic | forecolor backcolor |' +
                'alignleft aligncenter alignright alignjustify |' +
                'outdent indent | numlist bullist | emoticons nonbreaking | fullscreen',
        menubar: 'file edit insert view format table tools custom',
        advlist_bullet_styles: 'default,square,circle,disc',
        quickbars_selection_toolbar: 'bold italic | forecolor backcolor | formatselect | quicklink blockquote',
        quickbars_insert_toolbar: 'nonbreaking | quicktable | numlist bullist | outdent indent | hr pagebreak | emoticons', // quickimage
        menu: {
            custom: { title: 'Lists', items: 'customBulletLine customBulletPlus' }
        },
        nonbreaking_force_tab: true,
        lists_indent_on_tab: true,
        statusbar: true,
        draggable_modal: true,
        branding: false,
        fullscreen_native: true,
        height: 250,
        toolbar_mode: 'floating',
        placeholder: 'Type here...',
        default_link_target: '_blank',
        paste_word_valid_elements: "b,strong,i,em,h1,h2",
        paste_enable_default_filters: false,
        mobile: {
            resize: false
        },
        image: null,
        // paste_preprocess: function(plugin, args) {
        // 	args.content += ' ';
        // },
        // indent_use_margin: true,
        // image_title: true,
        // file_picker_types: 'file image',
        // images_file_types: 'jpeg,jpg,png,bmp,webp',
        // paste_as_text: true,
        paste_data_images: false,
        file_picker_callback: function(cb, value, meta){
            let input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            let that = this;

            input.onchange = function () {
                let file = this.files[0];
                that.image = file;

                let reader = new FileReader();
                reader.onload = function (e) {
                    let id = 'blobid' + (new Date()).getTime();
                    let blobCache =  tinymce.activeEditor.editorUpload.blobCache;
                    let base64 = reader.result.split(',')[1];
                    let blobInfo = blobCache.create(id, file, base64);
                    blobCache.add(blobInfo);
                    // console.log({ file, blobCache, base64, blobInfo, uri: blobInfo.blobUri() });

                    /* call the callback and populate the Title field with the file name */
                    cb(blobInfo.blobUri(), { title: file.name, alt: file.name });
                };
                reader.readAsDataURL(file);
            };

            input.click();
            input.remove();
        },
        setup: function(editor){
            editor.on('OpenWindow', e => {
                let that = this;
                $('.tox-button[title="Save"]').off('click').on('click', function() {
                    if(e.target.image && {}.toString.call(cbUploadImage) === '[object Function]'){
                        $(this).prop('disabled', true);

                        // cbUploadImage(e.target.image, (uri, file) => {
                        // 	// console.log({ ___uri: uri, __file: file });
                        // 	$(this).prop('disabled', false);

                        // 	e.target.windowManager.close();
                        // 	that.image = null;
                        // 	tinyMCE.activeEditor.execCommand('mceInsertContent', false, `
                        // 		<img src="${uri}" width="300" height="239" alt=${file.path} />
                        // 	`);
                        // }, that);
                    }
                })
            })

            editor.on('KeyDown', e => {
                // console.log({ __code: e.keyCode, char, currentChar, __key: e.key });

                if ((e.keyCode == 8 || e.keyCode == 46) && editor.selection) { // delete & backspace keys
                    const selectedNode = editor.selection.getNode(); // get the selected node (element) in the editor

                    if (selectedNode && selectedNode.nodeName == 'IMG') {
                        const { src, title, alt } = selectedNode;

                        $.ajax({
                            type: "POST",
                            url: "/pcm/remove-file-editor",
                            data: { path: alt }
                        }).done(resp => {
                            console.log({ resp });
                        }).fail(err => console.error(err))
                    }
                }

                if (e.keyCode === 9) { // tab pressed
                    if (e.shiftKey) {
                        editor.execCommand('Outdent');
                    }else {
                        editor.execCommand('Indent');
                    }

                    e.preventDefault();
                    return false;
                }
            });

            editor.ui.registry.addMenuItem('customBulletLine', {
                text: 'Bullet line',
                icon: 'horizontal-rule',
                tooltip: 'Insert Bullet Line',
                onAction: function (_) {
                    editor.execCommand('mceInsertContent', false, `<li style="list-style-type: '- '"> </li>`);
                }
            });

            editor.ui.registry.addMenuItem('customBulletPlus', {
                text: 'Bullet plus',
                icon: 'plus',
                tooltip: 'Insert Bullet Plus',
                onAction: function (_) {
                    editor.execCommand('mceInsertContent', false, `<li style="list-style-type: '+ '"> </li>`);
                }
            });

            // editor.on('Paste', e => {
            // 	console.log({ __pasteEvent: e });
            // })

            // editor.on('Undo', e => {
            // 	console.log({ e });
            // 	const selectedNode = editor.selection.getNode();
            // 	if (selectedNode && selectedNode.nodeName == 'IMG') {
            // 		console.log('Undo: ', { __node: selectedNode.nodeName });
            // 		e.target.undoManager.clear();
            // 	}
            // })

            if(cb && {}.toString.call(cb) === '[object Function]'){
                cb(editor);
            }
        },
        ...options,
    });
}
//
$(document).ready(function() {
    //_____________________________MOBILE MENU EVENT
    $(".t-mobile-menu-btn, .t-mobile-menu-close-btn").click(function() {
        $("body").toggleClass("mobile-menu-active");
    });
    //_________________________ANIMATE NAVIGATION TO BLOCK
    $(".t-home-scrolldown-btn").click(function() {
        const scrollPosotion = mediaQueryPc.matches ? ($(this).offset().top + 80) : $(this).offset().top + 50;
        $("html, body").animate({
            scrollTop: scrollPosotion
        }, 400);
    });
    //______________________________PLAY PRODUCT VIDEO EVENT_________________________________
    $(".t-product-banner-video-play-btn").click(function() {
        $(this).hide();
    });
     window.urlQuery = function(name){
        var results = new RegExp('[\?&] ' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null){
            return null;
        }else{
            return results[1] || 0;
        }
    }
    window.checkExitValue = function ({ data, callback }) {
        if(!data){
            if(callback){
                callback.showError();
            }else{
                return { error : true, message : 'data is exist' } 
            }
        }
        
    }
    //AJAX_promise
    // trả về kết quả  call và trạng thái
    // bắt buộc server phải trả theo cấu trúc {error , data} nếu không sẽ mặt định là Lỗi
    // và  timeLive là thời gian call ajax  giới hạn cho phép : ví dụ timeLive : 60000, thì call ajax quá 1phút thì sẽ ko call mà trả về lỗi 

    window.ajax_HV =async  function ({dataCallAjax, timeLive }){
        let stringMethodAccept = 'GET POST PUT DELETE';
        if(!dataCallAjax){
            console.log('miss url or method');
            return resolve({error : true, message : 'miss url or method' })
        }
        if(!dataCallAjax.url || !dataCallAjax.method){
             console.log('miss url or method');
             return resolve({error : true, message : 'miss url or method' })
        }
      
        if(!timeLive || timeLive.isNaN){
            timeLive = 60000;
        }
        timeLive = Number(timeLive);
        let promiseDefault      = new Promise((resolve)=>{
            setTimeout(function(){
                return resolve({error : true, message : `server too slow much time for req (time defalt :  ${timeLive})` })
            },timeLive);
        })
        let promiseCallServer   =  new Promise(async (resolve) =>{
            if(!dataCallAjax){
                console.log('miss url or method');
                return resolve({error : true, message : 'miss url or method' })
            }
            if(!dataCallAjax.url || !dataCallAjax.method){
                 console.log('miss url or method');
                 return resolve({error : true, message : 'miss url or method' })
            }
            if(!dataCallAjax.data){
                dataCallAjax.data ={};
            }
            let { url, data, method } = dataCallAjax;

            method  = method.toUpperCase()
            if(!stringMethodAccept.includes(method)){
                console.log('miss url or method');
                return resolve({error : true, message : ' method not accept' })
            }
            await  $.ajax({
                url,
                data,
                method,
                success:function(resp){
                    if(resp){
                        if(!resp.error && resp.data){
                            let data = resp.data;
                            return resolve({error : false, data });
                        }else{
                            return resolve({error : true, message : resp})
                        }
                    
                    }else{
                        return resolve({error : true, message : resp})
                    }
                },
                error : function(error){
                    return resolve({error : true, message : error})
                }
            })
        });
       let result  =  await  Promise.race([promiseDefault, promiseCallServer]);
       return result;
    };
    window.getDataServerAndMapView = async function( {dataCallAjax, timeLive, dataToView }){
        if(!dataToView.showSuccess){
            dataToView.showSuccess = function(data){
                console.log('get data success', data)
            }
        }
        if(!dataToView.showError){
            dataToView.showError = function(error){
                console.log('get data fail', error)
            }
            
        }
        let resultCallAjax = await ajax_HV({dataCallAjax, timeLive});
        let callback = {}
        callback.showError = function(){  dataToView.showError(resultCallAjax.message) } 
        checkExitValue({ data:  resultCallAjax.error, callback });
        let data   = resultCallAjax.data;
        dataToView.showSuccess(data);
    }

})


