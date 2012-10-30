# Use Case #

As part of understanding how to create a nice UI that fits naturally, I am attempting to theorize on how users may use the interface before I design it. 

The mentioned sites are purely examplary and do not necessarily reflect the preference of any RepoTheWeb hackers. 

--

The user registers GMail for mailto links. When he clicks a contact link from an unrelated site, it goes straight to the GMail compose screen. Later on, he decides to switch to HotMail, at which the next contact link leads to a choice between GMail and HotMail.

(We've implemented this far already)

He prefers HotMail, so he clicks the configure link (could be inline with the selection page?) to set his preference. He is later given a work eMail which he registers, but his default stays at HotMail whereas he wants to choose between HotMail and his work. So he opens his RepoTheWeb configuration bookmark and clicks the mailto link. Here he deletes GMail and remove the default handler setting he set previously.

-- 

This should be a decent approximation of Repo user usage, not having access to any real data (as it is for radical software).  

So anyways, Morals?

1. We can assume schemas from the links from the selection page, and should take the user straight to it.

2. It is well worth the user's time to bookmark the configuration page. 

3. We need to quickly and efficiently get the user to the correct schema to configure, as they're probably after a specific one. 

# User Understanding #

It is also important to understand what the user would understand, and I believe I have more physical data for this.

I find myself telling friends and family that RepoTheWeb is:

	Choice over the services you use to view web data. 

# Utility Ideas #

An interesting utility feature for RepoTheWeb is to provide URL-based configuration as an alternative to HTML-based configuration. This could be used, for example, by IT help desks to fix complaints about RepoTheWeb automatic redirection and for users to share defaults. 