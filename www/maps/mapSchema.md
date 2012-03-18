#Map URL Schema#

The "map" URL schema (map in the protocol component of the URL), provides a way for web developers to place markers and layers on the user's chosen mapping service and embed it in their sites. 

Beyond being a demo schema, it is intended to be built upon to create a real world one. 

##Overall Format##

The format of map URLs are compatible with normal URL formats, but the path component appears slightly different. 

BNF notation for this format is:

    root ::= "map:///" < layer > { "&" < layer > } [ "#" < zoom > ] [ "?" < urlParams > ]
    layer ::= < locschema > [ ":" < sublocschema > ] [ "/" < loccontent > ]
    zoom ::= < number > | < bbox >
		bbox ::= < sublocschema > < number > "," < number > ":" < number > "x" < number >

From "root" where the undefined syntax means:

- urlParams: Standard URL parameter syntax.
- locschema: A selection of "location schemas" defined later.
- sublocschema: A selection of specific schemas for the location schema defined previously.
- loccontent: Dependant for the location schema, both sublocschema and loccontent are defined under their location schema.
- number: a sequence of numerical digits. 

The syntax marked as optional in the layer syntax may be required by some location schemas, while in the others it is ignored. 

###Defination###

When a mapping service opens a map URL, it should render it's base layer and do the following:

- Render all the locations and layers defined in the "layer" syntax on top of the map. 
- If "zoom" is a number, center on the first marker and zoom to that level.
- If it is a "bbox" syntax:

	- Size your map to the rectangle defined by the numbers according to the projection standard in the "sublocschema" prefix.

- Take into account the parameters, which are defined later in this standard.

##Location Schemas##

Since there's multiple ways to describe a position on Earth, each one has it's own "location schema", and since there may be multiple standards describing it's use, "sub location schemas" are defined. 

###address###

The "address" location schema is defined as the simplest and most accurate location schema. It has no sub schemas and simple syntax, but can only define roadside locations. 

It's content is a standard address with a single comma (,) and no space seperating each component. Where a component contains spaces an underscore (_) may be used instead. It may be postfixed with a detail URL.

###name###

The "name" location schema is simalor to address, but can only be used on locations that country has a official name for. It's sub schemas are ISO country codes and it's content is the official name of a location. It may be postfixed with a detail URL.

###proj###

The "proj" location schema provides a way to place a marker in a specific schema, but it's relation to objects in the base layer may change dependant on provider. 

The subschema is the standard used by the content, defaulting to latitude&longitude ("latlon"). The content is two numbers in that projection standard defined by the subschema seperated by a comma (,). It may be postfixed with a detail URL. 

Supported subschemas/projections include:

- TODO: define a list of supported projections.
- latlon (latitude&longitude)
- more may be supported by mapping services

###web###

The "web" location schema tells the service to download a layer off the web and add it to the top layer of the map. 

The sub schema defines a web mapping standard like WMS and the content is a URL escaped template URL to be used by the standard to download mapping data. It may not be postfixed by a detail URL. 

Supported web mapping standards include (taken from OpenLayers & extended to include WFS):

- ArcGIS
- ArcIMS
- GeoRSS
- rest -- Generic template URL for downloading tile images, passed x, y, z.
- image -- An image to lay upon the map, postifixed with "@" followed by a bbox.
- kamap
- TMS
- WMS
- WMTS
- WFS
- WFS-T (optional for implementation)

###gps###

Marks the user's current location. Does not accept sub schemas or content. 

###Detail URLs###

Most of the location schemas can be postfixed by a detail URL, a concept explained here.

The format for a detail URL is a forward slash (/) followed by a URL escaped URL containing information about the point. This provides the map service a (should be small) page of information on the point to display at the user's request. 

##Paramaters##

To control the appearance of the map, a number of paramaters can be set in the URL. 

###type###

The "type" paramater controls which map the service renders. The standard options for this paramater are:

- road
- sattelite
- hybrid
- terrain

###lang###

Controls the language the map is rendered in. It is in the format cc-cc where cc is an ISO country code. The first country code represents the language, while the second represents a specific dialect.

###local###

Controls the local conventions used on the map. The value should be an ISO country code.

###control###

Sets the "controls" rendered on top of the map. The meaning of this is left lenient. The value can be a selection of:

- zoom
- pan
- type
- scale

###style###

This paramater is optional for implementation. It's value is a URL to a GSS file to be used to style the map. GSS is defined later in this standard.

##Cross Document Messaging##

Once downloaded, a mapping service MAY allow communication with the source site via W3C's Cross Document Messaging standard. 

###Format from map to parent###

TODO: Define syntax

###Format from parent to map###

TODO: Define syntax

###Properties###

The Properties the Cross Document Messaging, as defined in the previous two subsections, (with Google Maps inspiration) are:

- bounds -- The current bounding box of the map. Has properties x, y, width, and height as numbers in the provided projection or latlon.
- center -- The current central point of the map. Has properties x and y as numbers in the provided projection or latlon.
- direction -- The direction represented going up the screen as a bearing. 
- type -- The map displayed as a string. One of road, sattelite, hybrid, or terrain.
- zoom -- The zoom level of the map as a number.
- layers -- The layers/locations rendered on the map. Represented as an array of objects with the properties schema, subschema, location, and detailURL as in the original URL.
- lang -- The language the map is rendered in, as 2 ISO country codes seperated by a dash (-) in a strong.
- locale -- The locale conventions the map is rendered in, as an ISO country.
- controls -- An array of strings representing the rendered controls as in the control paramater. 
- style -- The URL to a GSS file as a string used to render the map. 

##GSS##

GSS is a file type created for this standard which follows CSS syntax but with special properties and selectors. It is a more polished version of Cartagen's GSS. 

The specific defaults for GSS are not defined as they're up to the mapping service. Still requires some work. 

##selectors##

GSS has types, tags, and names to describe it's objects which roughly corrolate to CSS/HTML elements, classes, and IDs. Each of these GSS bases use the same syntax as their corralating CSS/HTML equivalant. 

###types###

A type describe what sort of shape and structure an object has. There are 3 types:

- node
- way
- relation

###tags###

A tag describes what an object is. Since there's so many types in the world, this standard does not attempt to standardize them. They're in the form domain-name, where both the replacements for domain and name are defined in seperate standards.

###names###

The geographically unique name of a location. This can be anything. 

###psuedoclasses###

The CSS psuedoclasses are also present in GSS.

##properties##

Unlike HTML, GSS styles visual elements instead of text, and so has different properties, but fewer. These properties or loosely derived from W3C's 2D Canvas standard.

###fill###

Controls the style inside the shape created by the object. It's a shortcut to it's subproperties:

- color -- The fill color, accepts any CSS color. Defaults to white.
- image -- A tag name or url call. In a way, renders as a pattern while on a node, renders as a single image

The values for the subproperties may appear in any order.

###stroke###

Controls the style of the border around the shape created by the object. It's a shortcut to it's subproperties:

- color -- The line color, accepts any CSS color. Defaults to black.
- width -- The line width, accepts any CSS size that translates to pixels or the values "none", "thin", "medium", or "thick". Defaults to "none".
- cap -- The line cap, accepts the values "butt", "round", or "square". Defaults to "butt".
- join -- The style for bends in the line, accepts the values "round", "bevel", and "miter" defaults to "miter".

The values for the subproperties may appear in any order.

###visible###

Value can be "visible", indicating it appears on the map, or "none" indicating that it does not. 

###font###

All the CSS font, text, and related properties are present in GSS to render the name of the object. 

###z-index###

As in CSS.
