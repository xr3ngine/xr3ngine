---
id: "renderer_postprocessing_blending_glsl_exclusion_shader_frag"
title: "Module: renderer/postprocessing/blending/glsl/exclusion/shader.frag"
sidebar_label: "renderer/postprocessing/blending/glsl/exclusion/shader.frag"
custom_edit_url: null
hide_title: true
---

# Module: renderer/postprocessing/blending/glsl/exclusion/shader.frag

## Properties

### default

• **default**: *vec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {

	return (x + y - 2.0 * x * y) * opacity + x * (1.0 - opacity);

}
*