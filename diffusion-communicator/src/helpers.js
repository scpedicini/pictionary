

function createResponseBody (additionalProperties) {
    const responseBody = {
        "prompt": "",
        "negative_prompt": "",
        "prompt_style": "None",
        "prompt_style2": "None",
        "steps": 4,
        "sampler_index": 0,
        "restore_faces": false,
        "tiling": false,
        "n_iter": 1,
        "batch_size": 1,
        "cfg_scale": 7,
        "seed": -1,
        "subseed": -1,
        "subseed_strength": 0,
        "seed_resize_from_h": 0,
        "seed_resize_from_w": 0,
        "height": 512,
        "width": 512,
        "enable_hr": false,
        "scale_latent": true,
        "denoising_strength": 0.7
    };

    return {
        txt2imgreq: Object.assign(responseBody, additionalProperties)
    };
}

export { createResponseBody };
