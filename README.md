



# About

Project allows to enable WebP images on any website, without touching it's source code.

Generation of WebP images is happening on the fly.

System listens to a browser "Accept" header. If browser supports WebP - it will get it. Otherwise original image will be returned.


There are 3 possible traffic flows:
![WebP at Edge Architecture](architecture.png?raw=true "Title")
1. User requests anything but images (for example html page, or css files) - he will be routed via bold lines directly to origin.
2. User requests an image, but browser does not support WebP - the request will also follow bold lines.
3. User requests an image and browser supports WebP - requests will be proxied to WebP generator, implemented on API Gateway + Lambda.
The Lambda will first request original image from the website (bold lines route), then it will convert it to WebP format and return to the user.  

This is by far the best solution for WebP generation in terms of performance and integration flexibility. 
As an image conversion tool was chosen a native [**cwebp**](https://developers.google.com/speed/webp/download) linux library, as it has shown
around 5% speed improvement over [**Sharp**](https://github.com/lovell/sharp), which is claimed to be faster then GraphicsMagic.
![Sharp and cwebp performance](cwebp_performance.png?raw=true "Title")

# Why?

Next-gen image formats, like **WebP** have better compression compared to jpg, png, or gif.
Using nex-gen images on a website will make it faster and improve user experience.
See https://developers.google.com/web/tools/lighthouse/audits/webp



# Requirements

1. Images on your website should be served via AWS CloudFront


# Deployment

**Step 1**. Enable "Accept" header in a configuration of CloudFront distribution.

**Step 2**. Install dependencies with **npm**:
```bash
npm install
```

**Step 3**. Deploy with **Serverless**
```bash
sls deploy
```
In the end of deployment you will see URL to WebP image generator, for example:
```bash
endpoints:
  GET - https://k1g2tmlk7b.execute-api.us-east-1.amazonaws.com/prod/webp
  GET - https://k1g2tmlk7b.execute-api.us-east-1.amazonaws.com/prod/webp/{proxy+}
```
The value of this output would be needed at the next step

**Step 4**. Create A Lambda Edge function manually and attach it to your CloudFront distribution.
Source code of the Edge Lambda is in the file *origin-request.js*.
Note that you need to update it with your domain name and with API Gateway URL, obtained in previous step. 


# Memory size choice
When choosing a memory size for a Lambda function, it's always a choice between performance and cost efficiency.
We recommend 1280Mb, as increasing memory size further does not give significant performance boost. 
![Choosing memory for cwebp](cwebp_memory_choice.png?raw=true "Title")
Watch column "80%". It shows how many milliseconds conversion took on average with different memory settings.
You may increase memory size to 3008Mb, which will make an extra 5% performance boost, and 2.5X cost increase.


# Performance considerations

**Positive performance impact**:
- Size of your images will be decreased in most cases. Users with slow internet connection will benefit the most.
 For example, 82Kb becomes 62Kb, when requested with "Accept:image/webp" header. For small images difference is even more significant:
 
 ```bash
 # with WebP
 curl -I https://mxx.news/media/website/MXX.jpg -H "Accept:image/webp" -X GET | grep content-
 content-type: image/webp
 content-length: 13770
 
 # without WebP
 curl -I https://mxx.news/media/website/MXX.jpg -H "Accept:image/jpg" -X GET | grep content-
 content-type: image/jpeg
 content-length: 34973
 ```

**Negative performance impact**: 
1. After enabling "Accept" header in CloudFront, caching efficiency was decreased for all website resources.
That is because CloudFront will keep separate cache for different browsers (different values of Accept header).
2. @Edge function, connected to Origin-Request event at Cloudfront slows down every request to origin by ~10ms
3. When there is no converted image in CloudFront, conversion takes ~650ms for a 82Kb jpeg.