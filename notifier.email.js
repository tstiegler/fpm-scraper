var emailNotifier = function(emailConfig) {

    var nodemailer = require('nodemailer');

    /**
     * Send notification email.
     */
    function sendNotification(notifications, pnt, info) {
        var subjectSpawns = "";
        var textSpawns = "";

        try {
            for(var i in notifications) {
                var noti = notifications[i];
                var expiryDate = new Date(noti.expiration);

                subjectSpawns += noti.name + " ";
                textSpawns += noti.name + " @ http://maps.google.com/maps?z=12&t=m&q=loc:" + noti.lat + '+' + noti.lng + '\r\n' + 'Expires @ ' + formatDate(expiryDate) + '\r\n\r\n'; 
            }
            subjectSpawns = subjectSpawns.substr(0, subjectSpawns.length - 1);

            // create reusable transporter object using the default SMTP transport
            var transporter = nodemailer.createTransport(emailConfig.connectionString);

            // setup e-mail data,
            var mailOptions = {
                from: emailConfig.sendFrom, // sender address
                to: emailConfig.sendTo, // list of receivers
                subject: 'Spawns (' + subjectSpawns + ')', // Subject line
                text: textSpawns
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });
        } catch(err) {
            console.log("Error in notification sending!");
            console.log(err);
        }
    }


    /**
     * Date fotmatting, ripped from somewhere.
     */
    function formatDate(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
    }    
    

    // Return module object.
    return {
        sendNotification: sendNotification
    };
};

module.exports = emailNotifier;