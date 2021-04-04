(window.webpackJsonp=window.webpackJsonp||[]).push([[456],{1348:function(e,t,r){"use strict";r.d(t,"a",(function(){return i})),r.d(t,"b",(function(){return d}));var a=r(0),n=r.n(a);function c(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function b(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,a)}return r}function p(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?b(Object(r),!0).forEach((function(t){c(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):b(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function o(e,t){if(null==e)return{};var r,a,n=function(e,t){if(null==e)return{};var r,a,n={},c=Object.keys(e);for(a=0;a<c.length;a++)r=c[a],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(a=0;a<c.length;a++)r=c[a],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var l=n.a.createContext({}),s=function(e){var t=n.a.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):p(p({},t),e)),r},i=function(e){var t=s(e.components);return n.a.createElement(l.Provider,{value:t},e.children)},j={inlineCode:"code",wrapper:function(e){var t=e.children;return n.a.createElement(n.a.Fragment,{},t)}},m=n.a.forwardRef((function(e,t){var r=e.components,a=e.mdxType,c=e.originalType,b=e.parentName,l=o(e,["components","mdxType","originalType","parentName"]),i=s(r),m=a,d=i["".concat(b,".").concat(m)]||i[m]||j[m]||c;return r?n.a.createElement(d,p(p({ref:t},l),{},{components:r})):n.a.createElement(d,p({ref:t},l))}));function d(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var c=r.length,b=new Array(c);b[0]=m;var p={};for(var o in t)hasOwnProperty.call(t,o)&&(p[o]=t[o]);p.originalType=e,p.mdxType="string"==typeof e?e:a,b[1]=p;for(var l=2;l<c;l++)b[l]=r[l];return n.a.createElement.apply(null,b)}return n.a.createElement.apply(null,r)}m.displayName="MDXCreateElement"},526:function(e,t,r){"use strict";r.r(t),r.d(t,"frontMatter",(function(){return b})),r.d(t,"metadata",(function(){return p})),r.d(t,"toc",(function(){return o})),r.d(t,"default",(function(){return s}));var a=r(3),n=r(7),c=(r(0),r(1348)),b={id:"src_services_project_project_helper",title:"Module: src/services/project/project-helper",sidebar_label:"src/services/project/project-helper",custom_edit_url:null,hide_title:!0},p={unversionedId:"docs-server/modules/src_services_project_project_helper",id:"docs-server/modules/src_services_project_project_helper",isDocsHomePage:!1,title:"Module: src/services/project/project-helper",description:"Module: src/services/project/project-helper",source:"@site/docs/docs-server/modules/src_services_project_project_helper.md",slug:"/docs-server/modules/src_services_project_project_helper",permalink:"/docs/docs-server/modules/src_services_project_project_helper",editUrl:null,version:"current",sidebar_label:"src/services/project/project-helper",sidebar:"sidebar",previous:{title:"Module: src/services/project/generate-collection.hook",permalink:"/docs/docs-server/modules/src_services_project_generate_collection_hook"},next:{title:"Module: src/services/project/project.access-control",permalink:"/docs/docs-server/modules/src_services_project_project_access_control"}},o=[{value:"Functions",id:"functions",children:[{value:"defaultProjectImport",id:"defaultprojectimport",children:[]},{value:"mapProjectDetailData",id:"mapprojectdetaildata",children:[]},{value:"mapProjectTemplateDetailData",id:"mapprojecttemplatedetaildata",children:[]},{value:"mapSceneData",id:"mapscenedata",children:[]},{value:"readJSONFromBlobStore",id:"readjsonfromblobstore",children:[]}]}],l={toc:o};function s(e){var t=e.components,r=Object(n.a)(e,["components"]);return Object(c.b)("wrapper",Object(a.a)({},l,r,{components:t,mdxType:"MDXLayout"}),Object(c.b)("h1",{id:"module-srcservicesprojectproject-helper"},"Module: src/services/project/project-helper"),Object(c.b)("h2",{id:"functions"},"Functions"),Object(c.b)("h3",{id:"defaultprojectimport"},"defaultProjectImport"),Object(c.b)("p",null,"\u25b8 ",Object(c.b)("strong",{parentName:"p"},"defaultProjectImport"),"(",Object(c.b)("inlineCode",{parentName:"p"},"models"),": ",Object(c.b)("em",{parentName:"p"},"any"),"): ",Object(c.b)("em",{parentName:"p"},"any"),"[]"),Object(c.b)("h4",{id:"parameters"},"Parameters:"),Object(c.b)("table",null,Object(c.b)("thead",{parentName:"table"},Object(c.b)("tr",{parentName:"thead"},Object(c.b)("th",{parentName:"tr",align:"left"},"Name"),Object(c.b)("th",{parentName:"tr",align:"left"},"Type"))),Object(c.b)("tbody",{parentName:"table"},Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"models")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"any"))))),Object(c.b)("p",null,Object(c.b)("strong",{parentName:"p"},"Returns:")," ",Object(c.b)("em",{parentName:"p"},"any"),"[]"),Object(c.b)("p",null,"Defined in: ",Object(c.b)("a",{parentName:"p",href:"https://github.com/xr3ngine/xr3ngine/blob/7650c2bea/packages/server/src/services/project/project-helper.ts#L20"},"packages/server/src/services/project/project-helper.ts:20")),Object(c.b)("hr",null),Object(c.b)("h3",{id:"mapprojectdetaildata"},"mapProjectDetailData"),Object(c.b)("p",null,"\u25b8 ",Object(c.b)("strong",{parentName:"p"},"mapProjectDetailData"),"(",Object(c.b)("inlineCode",{parentName:"p"},"project"),": ",Object(c.b)("em",{parentName:"p"},"any"),"): ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("h4",{id:"parameters-1"},"Parameters:"),Object(c.b)("table",null,Object(c.b)("thead",{parentName:"table"},Object(c.b)("tr",{parentName:"thead"},Object(c.b)("th",{parentName:"tr",align:"left"},"Name"),Object(c.b)("th",{parentName:"tr",align:"left"},"Type"))),Object(c.b)("tbody",{parentName:"table"},Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"project")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"any"))))),Object(c.b)("p",null,Object(c.b)("strong",{parentName:"p"},"Returns:")," ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("p",null,"Defined in: ",Object(c.b)("a",{parentName:"p",href:"https://github.com/xr3ngine/xr3ngine/blob/7650c2bea/packages/server/src/services/project/project-helper.ts#L105"},"packages/server/src/services/project/project-helper.ts:105")),Object(c.b)("hr",null),Object(c.b)("h3",{id:"mapprojecttemplatedetaildata"},"mapProjectTemplateDetailData"),Object(c.b)("p",null,"\u25b8 ",Object(c.b)("strong",{parentName:"p"},"mapProjectTemplateDetailData"),"(",Object(c.b)("inlineCode",{parentName:"p"},"projectTemplate"),": ",Object(c.b)("em",{parentName:"p"},"any"),"): ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("h4",{id:"parameters-2"},"Parameters:"),Object(c.b)("table",null,Object(c.b)("thead",{parentName:"table"},Object(c.b)("tr",{parentName:"thead"},Object(c.b)("th",{parentName:"tr",align:"left"},"Name"),Object(c.b)("th",{parentName:"tr",align:"left"},"Type"))),Object(c.b)("tbody",{parentName:"table"},Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"projectTemplate")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"any"))))),Object(c.b)("p",null,Object(c.b)("strong",{parentName:"p"},"Returns:")," ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("p",null,"Defined in: ",Object(c.b)("a",{parentName:"p",href:"https://github.com/xr3ngine/xr3ngine/blob/7650c2bea/packages/server/src/services/project/project-helper.ts#L117"},"packages/server/src/services/project/project-helper.ts:117")),Object(c.b)("hr",null),Object(c.b)("h3",{id:"mapscenedata"},"mapSceneData"),Object(c.b)("p",null,"\u25b8 ",Object(c.b)("strong",{parentName:"p"},"mapSceneData"),"(",Object(c.b)("inlineCode",{parentName:"p"},"scene"),": ",Object(c.b)("em",{parentName:"p"},"any"),", ",Object(c.b)("inlineCode",{parentName:"p"},"projectId"),": ",Object(c.b)("em",{parentName:"p"},"string"),"): ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("h4",{id:"parameters-3"},"Parameters:"),Object(c.b)("table",null,Object(c.b)("thead",{parentName:"table"},Object(c.b)("tr",{parentName:"thead"},Object(c.b)("th",{parentName:"tr",align:"left"},"Name"),Object(c.b)("th",{parentName:"tr",align:"left"},"Type"))),Object(c.b)("tbody",{parentName:"table"},Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"scene")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"any"))),Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"projectId")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"string"))))),Object(c.b)("p",null,Object(c.b)("strong",{parentName:"p"},"Returns:")," ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("p",null,"Defined in: ",Object(c.b)("a",{parentName:"p",href:"https://github.com/xr3ngine/xr3ngine/blob/7650c2bea/packages/server/src/services/project/project-helper.ts#L3"},"packages/server/src/services/project/project-helper.ts:3")),Object(c.b)("hr",null),Object(c.b)("h3",{id:"readjsonfromblobstore"},"readJSONFromBlobStore"),Object(c.b)("p",null,"\u25b8 ",Object(c.b)("strong",{parentName:"p"},"readJSONFromBlobStore"),"(",Object(c.b)("inlineCode",{parentName:"p"},"storage"),": ",Object(c.b)("em",{parentName:"p"},"any"),", ",Object(c.b)("inlineCode",{parentName:"p"},"key"),": ",Object(c.b)("em",{parentName:"p"},"any"),"): ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("h4",{id:"parameters-4"},"Parameters:"),Object(c.b)("table",null,Object(c.b)("thead",{parentName:"table"},Object(c.b)("tr",{parentName:"thead"},Object(c.b)("th",{parentName:"tr",align:"left"},"Name"),Object(c.b)("th",{parentName:"tr",align:"left"},"Type"))),Object(c.b)("tbody",{parentName:"table"},Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"storage")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"any"))),Object(c.b)("tr",{parentName:"tbody"},Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("inlineCode",{parentName:"td"},"key")),Object(c.b)("td",{parentName:"tr",align:"left"},Object(c.b)("em",{parentName:"td"},"any"))))),Object(c.b)("p",null,Object(c.b)("strong",{parentName:"p"},"Returns:")," ",Object(c.b)("em",{parentName:"p"},"any")),Object(c.b)("p",null,"Defined in: ",Object(c.b)("a",{parentName:"p",href:"https://github.com/xr3ngine/xr3ngine/blob/7650c2bea/packages/server/src/services/project/project-helper.ts#L87"},"packages/server/src/services/project/project-helper.ts:87")))}s.isMDXComponent=!0}}]);