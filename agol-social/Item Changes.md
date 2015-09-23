Item Changes:
-          ~~item.info.update (File attached to item, metadata, not useful to end-user)~~
-          item.resource.delete (Media can be stored here.  Sentha to sync with Story Maps and App Studio teams on this.  Apps have to manage this dependency)
-          item.proxy.delete (Dependencies can be affected by this just as with unsharing. Sentha: Talk to Jos for more info)
-          item.service.create (PB to find more about this)
 
Folder Change Types:
-          folder.add (owner needs to know when admin does this)
-          folder.delete (owner needs to know when admin does this)
 
User Change Types:
Most user access issues are handled through email:
-          user.gentoken.success (Could be email, later)
-          user.gentoken.failure (Could be email, later)
-          user.forget_password_requested (email)
-          user.forgot_username (email)
-          user.invitation.approve (email)
-          user.pwd.update (email)
-          user.pwd.reset (email)
-          user.pwd.expire (email)
-          user.secanswer.update (email)
-          user.mfa.enable (email)
-          user.mfa.disable (email)
Requires aggregation:
-          user.reassign (will trigger item.reassign; requires aggregation)
 
Role Change Types:
-          role.update (privileges in role changed)
 
Org Change Types:
-          org.update (useful for admins to know, but not without knowing what changed.  Need to know what specific fields we want to track)
For some org-level changes, the admin is expected to pre-inform the org members through email, etc.  This will not be dealt with through notifications/feeds.
-          org.pwdpolicy.update (admin should pre-inform)
-          org.idp.register (admin should pre-inform)
