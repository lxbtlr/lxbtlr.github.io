// CV, generated from the same data as the about me page (cv/index.njk).
// Build: make cv  (typst compile --root . cv/cv.typ files/Alex_Butler_CV.pdf)
// Fields used only here: site.researchInterests, experience[].location and
// experience[].bullets, education[].date.

#let site = json("/_data/site.json")
#let education = json("/_data/education.json")
#let experience = json("/_data/experience.json")
#let publications = json("/_data/publications.json")
#let awards = json("/_data/awards.json")
#let projects = json("/_data/projects.json")
#let service = json("/_data/service.json")

#let accent = rgb("#34855B")
#let muted = luma(90)

#set document(title: site.name + " CV", author: site.name)
#set page(
  paper: "us-letter",
  margin: (x: 0.8in, top: 0.7in, bottom: 0.8in),
  footer: context align(center, text(8.5pt, fill: muted)[
    #site.name — Page #counter(page).display() of #counter(page).final().first()
  ]),
)
#set text(font: "Libertinus Serif", size: 10pt)
#set par(leading: 0.5em, spacing: 0.75em)
#show link: set text(fill: accent)

// Section heading: small caps over a rule.
#let section(title) = {
  v(1.1em, weak: true)
  block(sticky: true, below: 0.6em)[
    #text(12.5pt, weight: "bold", tracking: 0.04em, smallcaps(title))
    #v(-0.55em)
    #line(length: 100%, stroke: 0.5pt + luma(130))
  ]
}

// One line with text on the left and a date flush right.
#let row(l, r) = grid(
  columns: (1fr, auto),
  column-gutter: 1em,
  l, align(end, r),
)

#let bullets(items) = if items.len() > 0 {
  list(indent: 0.2em, body-indent: 0.4em, spacing: 0.4em, ..items)
}

// Bold my name in an author list.
#let me = "Alexander Butler"
#let authors(s) = s.split(me).join(strong(me))

#let shown(p) = not p.at("unlisted", default: false) and not p.at("hideOnCv", default: false)

// ---------------------------------------------------------------- header
// Set in the site's font, Atkinson Hyperlegible Next (cv/fonts).
#align(center, text(font: "Atkinson Hyperlegible Next")[
  #text(24pt, weight: "bold", site.name)
  #v(0.2em)
  #site.institution #h(0.4em)·#h(0.4em) #site.lab \
  #link("mailto:" + site.email, site.email) #h(0.4em)·#h(0.4em)
  #link(site.website, site.website.replace("https://", "")) #h(0.4em)·#h(0.4em)
  #link("https://github.com/" + site.github, "github.com/" + site.github)
])

// ------------------------------------------------------------- sections
#section("Research Interests")
#site.researchInterests

#section("Education")
#for edu in education {
  block(below: 0.8em)[
    #row([*#edu.institution*, #edu.location], edu.at("date", default: ""))
    #for d in edu.degrees {
      let adv = d.at("advisor", default: none)
      row(
        [#d.degree in #d.major#if adv != none [, #emph[Advised by #adv]]],
        d.date,
      )
    }
  ]
}

#section("Experience")
#for job in experience {
  let loc = job.at("location", default: none)
  block(below: 0.8em)[
    #row([*#job.org*#if loc != none [, #loc]], job.date)
    #v(-0.3em)
    #emph(job.role)
    #bullets(job.at("bullets", default: ()))
  ]
}

#section("Publications")
#for pub in publications.sorted(key: p => p.year).rev() {
  let url = pub.at("url", default: pub.at("pdf", default: none))
  block(below: 0.8em)[
    #if url != none { link(url, strong(pub.title)) } else { strong(pub.title) }. \
    #text(fill: muted, authors(pub.authors)). \
    #emph(pub.venue).
  ]
}

#section("Awards")
#for a in awards {
  row([*#a.title*, #emph(a.org).], a.date)
}

#section("Projects")
#for p in projects.filter(shown) {
  let skills = p.at("skills", default: ())
  block(below: 0.8em)[
    #link(site.website + p.url, strong(p.name)) \
    #if "role" in p [#emph(p.role)#if not p.role.ends-with(".") [.] ]#p.desc \
    #text(9.5pt, fill: muted, skills.map(s =>
      if type(s) == dictionary { link(s.url, s.text) } else { s }
    ).join(" · "))
  ]
}

#section("Service")
#for s in service {
  row([*#s.role*, #s.org.], s.date)
}
