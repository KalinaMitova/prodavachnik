function startApp() {

    //Kinvey data
    const usersUrl = 'https://baas.kinvey.com/user/kid_HkVTRpED-';
    const advertsUrl = 'https://baas.kinvey.com/appdata/kid_HkVTRpED-/Adverts';
    const appKey = 'kid_HkVTRpED-';
    const appSecret = 'd74958eab606473dafb03b166b86f0b9';

    //DOM elements --------------------------------------------------------------------------------------------
    let menuBarEls = $("header").find("a");

       // menu bar
    let linkHome = $("#linkHome");
    let linkLogin = $("#linkLogin") ;
    let linkRegister = $("#linkRegister");
    let linkListAds = $("#linkListAds");
    let linkCreateAd = $("#linkCreateAd");
    let linkLogout = $("#linkLogout");
    let userMess = $("#loggedInUser");

       //section
    let sections =$("main").find("section");
    let homeSection = $("#viewHome");
    let loginSection = $("#viewLogin");
    let registerSection = $("#viewRegister");
    let createAdSection = $("#viewCreateAd");
    let adsSection = $("#viewAds");
    let editSection = $("#viewEditAd");
    let detailsAdSection = $("#viewDetailsAd");

        //forms
    let registerForm =$("#formRegister");
    let loginForm = $('#formLogin');
    let createAdForm = $("#formCreateAd");
    let editForm = $("#formEditAd");

        //boxes
    let loadingBix = $("#loadingBox");
    let errorBox = $("#errorBox");
    let infoBox = $("#infoBox");

     showHomePage();
     attachEventsToMenuBarLink();
     attachEventsToMessageBoxes();
     attachEventsToFormButtons();


    //Events----------------------------------------------------------------------------------------
        //Attach events for page section
    function attachEventsToMenuBarLink() {
        linkHome.click(() => {makeVisibleSection(homeSection)});
        linkLogin.click(() => {makeVisibleSection(loginSection)});
        linkRegister.click(() => {makeVisibleSection(registerSection)});
        linkCreateAd.click(() => {
            makeVisibleSection(createAdSection);
            createAdForm.find('[name="datePublished"]').val(new Date().toISOString().split('T')[0]);
            createAdForm.find('[name = "price"]').val('0.00');
        });
        linkListAds.click(() => {
            makeVisibleSection(adsSection);
            showAdverts();
        });
        linkLogout.click(logoutUser);
    }

     //Attach event to the info and error messages
    function attachEventsToMessageBoxes() {
               errorBox.click(() =>{errorBox.fadeOut()});
               infoBox.click(() =>{infoBox.fadeOut()});

            //attach event to the loading box - show message every time when send request to the DB/Loading on
          $(document).on({
                ajaxStart: () => {loadingBix.fadeIn()},
                ajaxStop: () => {loadingBix.fadeOut()}
          })
    }

        //Attach events to the form`s buttons
    function attachEventsToFormButtons() {
          $('#buttonRegisterUser').click(registerNewUser);
          $('#buttonLoginUser').click(loginUser);
          $('#buttonCreateAd').click(createAd);
          $('#buttonEditAd').click(editAd);
    }

     //Home page -------------------------------------------------------------------------------
    function showHomePage() {
        if (sessionStorage.getItem('authtoken') !== null) {

          makeInvisibleMenuLink([linkLogin, linkRegister]);
          userMess.text(`Welcome, ${sessionStorage.getItem('username')}!`);
          userMess.show();
          showAdverts();
          makeVisibleSection(adsSection);

        } else {
          makeInvisibleMenuLink([linkLogout, linkListAds, linkCreateAd]);
          userMess.hide();
          makeVisibleSection(homeSection);
        }
    }

     //show/hide elements from dom    
     function makeVisibleSection(domEl) {
         sections.hide();
         domEl.show();
     }

     function makeInvisibleMenuLink(domElArr) {
         menuBarEls.show();
         domElArr.forEach(e => e.hide());
     }

    //Users --------------------------------------------------------------------------------------
        //Create new user
    async  function registerNewUser() {
        //get data for new user  from register form
        let newUser = createObjFromFormData(registerForm);
        
        if(newUser.username === ''){
            displayMess('error', 'Username can not be empty');
            return;
        }
        if(newUser.password === ""){
            displayMess('error', 'Password can not be empty');
            return;
        }

        //sent request
        try{
            let response = await  request(usersUrl,'',"POST", authorisation('basic'),newUser);
               setStorage(response);
               registerForm.trigger("reset");
               showHomePage();          
        } catch (err){
            displayError(err);
        }
    }

    async  function logoutUser() {
         try{
              await request(usersUrl, "_logout","POST", authorisation(''));
              sessionStorage.clear();
              showHomePage();
              displayMess('info',"Successfully logged out");
         }  catch (err){
             displayError(err);
         }

    }

    async function loginUser() {
            //get data from the login form
        let user =createObjFromFormData(loginForm);

        if(user.username === ''){
            displayMess('error', 'Username can not be empty');
            return;
        }
        if(user.password === ""){
            displayMess('error', 'Password can not be empty');
            return;
        }

        try{
              let response = await request(usersUrl, 'login', "POST", authorisation('basic'), user);
              setStorage(response);
               loginForm.trigger("reset"); 
              showHomePage();             
        }  catch (err){
            displayError(err);
        }
    }
    
    //Ads-----------------------------------------------------------------------------------------------------
        //Create ad
    async function createAd() {

         let newAd = createObjFromFormData(createAdForm);
         newAd.publisher = sessionStorage.getItem('username');

        if(newAd.title.length === 0){
            displayMess('error', 'Title can not be empty');
            return;
         }
         if(newAd.description.length === 0){
            displayMess('error', 'Description can not be empty');
            return;
         }
          if(Number.isNaN(newAd.price) === null){
             displayMess('error', 'Price can not be empty');
             return;
          }

          try{
              await request(advertsUrl,'',"POST",authorisation(),newAd);

              createAdForm.trigger('reset');
              makeVisibleSection(adsSection);
              showAdverts();
              displayMess('info', 'Successfully create an ad');
           } catch (err){
              displayError(err);
          }
    }
    
        //show all advertisements
    async function showAdverts() {
                  let container =  adsSection.find('table tbody');
                  container.empty();
                  try{
                      let data = await request(advertsUrl,'',"GET", authorisation());
                      if(data.length === 0){
                          container.append($("<tr>").text("No ads in database"));
                          return;
                      }
                      data.forEach(a =>{
                          let actions = [];
                          if(a._acl.creator === sessionStorage.getItem('id')){
                              actions.push($('<a href="#">').text('[Delete]').click(() =>{deleteAd(a._id)}));
                              actions.push($('<a href="#">').text('[Edit]').click(showEditForm.bind(this, a)));
                          }
                          container.append($('<tr>')
                              .append($('<td>').text(a.title))
                              .append($("<td>").text(a.publisher))
                              .append($('<td>').text(a.description))
                              .append($('<td>').text(Number(a.price).toFixed(2)) )
                              .append($('<td>').text(a.datePublished))
                              .append($('<td>')
                                .append($('<a href="#">')
                                    .text('[Read More]')
                                    .click(displayAdvert.bind(this, a)))
                                .append(actions)));

                      })
                  } catch (err){
                      displayMess('error', err.message);
                      displayError(err);
                  }

                  async  function deleteAd(id) {

                      try{
                          await request(advertsUrl,id,"DELETE", authorisation());
                          showAdverts();
                          displayMess('info', "Successfully deleted the ad");
                      }catch (err){
                        displayError(err);
                      }

                  }

                  async function showEditForm(advert) {
                      editForm.find("[name = 'id']").val(advert._id);
                      editForm.find("[name = 'publisher']").val(advert.publisher);
                      editForm.find("[name = 'title']").val(advert.title);
                      editForm.find("[name = 'description']").val(advert.description);
                      editForm.find("[name = 'datePublished']").val(advert.datePublished);
                      editForm.find("[name = 'price']").val(Number(advert.price).toFixed(2));
                      editForm.find("[name = 'image']").val(advert.image);
                      makeVisibleSection(editSection);

                  }
                  
                  function displayAdvert(advert) {
                      makeVisibleSection(detailsAdSection);
                      let container = detailsAdSection.find('> div');
                      container.empty();
                      container
                              .append($('<img style="width:255px;height:228px;">')
                                  .attr('src', advert.image))
                              .append($("<br>"))
                              .append($("<label>").text("Title: "))
                              .append($("<h1>").text(advert.title))
                              .append($("<label>").text("Description: "))
                              .append($("<p>").text(advert.description))
                              .append($("<label>").text("Publisher: "))
                              .append($("<div>").text(advert.publisher))
                              .append($("<label>").text("Date: "))
                              .append($("<div>").text(advert.datePublished))
                              .append($("<label>").text("Views: "))
                              .append($("<div>").text('1'))
                              .append($("<br>"))
                              .append($('<a href="#">')
                                  .text('Go Back')
                                  .click(() =>{makeVisibleSection(adsSection); showAdverts()}));
                  }
    }

    async function  editAd() {
        let editedAdvert = createObjFromFormData(editForm);
        let advertId = editedAdvert.id;
        delete editedAdvert.id;

        try{
           await request(advertsUrl, advertId, "PUT", authorisation(), editedAdvert);
           makeVisibleSection(adsSection);
           showAdverts();
           displayMess('info', 'Successfully edited the ad');
        } catch (err){
            displayError(err);
        }
    }

      //Request-----------------------------------------------------------------------------------------------
        //create request
    function request(url, ends, method, authorize, data) {
        return $.ajax({
            url: url + '/' + ends,
            method: method,
            headers:authorize,
            data: data
        })
    }

        //create header
    function authorisation(type) {
        if(type === "basic"){
            return {Authorization: "Basic " + btoa(appKey + ':' + appSecret)}
        }
            return {Authorization: "Kinvey " + sessionStorage.getItem('authtoken')}
    }

     //create object from form data
     function createObjFromFormData(form){
         let obj ={};
         form.serializeArray().forEach(ob => obj[ob.name] = ob.value) ;
         return obj;
     }

      //Set storage
    function setStorage(response) {
        sessionStorage.setItem('username', response.username);
        sessionStorage.setItem('authtoken', response._kmd.authtoken);
        sessionStorage.setItem('id', response._id);
    }

    //Show errors and messages----------------------------------------------------------------------------------------
    function displayMess(type, message) {
        switch (type){
            case "error" :{
                   errorBox.text( `Error: ${message}`);
                   errorBox.fadeIn();
            }break;
            case "info" :{
                   infoBox.text(message);
                   infoBox.show();
                   setTimeout(() => {infoBox.hide()},3000);
            }break;
        }
    }

    function displayError(err) {
        displayMess('error', err.responseJSON.description) ;
    }


}