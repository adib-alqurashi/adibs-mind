---
date: 2026-10-24
summary: Why "best fit" means "closest shadow", and why the eigenvalues of a data matrix tell you how much of the picture a smaller model keeps.
tags: [article, math, linear-algebra, draft]
---
# Least squares is a shadow

> Draft. The ideas are in place; the worked example and the figures still need to be done by hand on the board.

## Introduction

Every regression course starts the same way: you have points, you want a line, you minimise the sum of squared errors, and a formula appears. The formula is right, but it hides the picture. There is a picture, and once you see it, a lot of machine learning stops looking like a bag of tricks.

The picture is a shadow. Fitting a model by least squares is finding the shadow that your data casts on the set of things the model can say. Everything else in this article follows from that one sentence.

## Main part

### The data is one point, not many

The usual way to draw a regression is as many points in the plane with a line through them. Try the opposite. Put all the target values $y_1, \dots, y_n$ into one vector $y$. That is a single point in $n$-dimensional space, one coordinate for each observation.

A linear model with $p$ features can only produce vectors of the form $X\beta$. As $\beta$ runs over all possible values, $X\beta$ sweeps out a flat subspace, the column space of $X$. It is a plane (or a higher-dimensional flat) sitting inside the big $n$-dimensional space, and in general $y$ is not on it. That is the whole problem: the thing you want to say is not something the model can say.

### The closest thing the model can say

If you cannot reach $y$, the natural move is to get as close as possible. "Closest" in Euclidean distance is exactly "smallest sum of squared errors", because distance squared *is* the sum of squared coordinate differences. So least squares asks for the point on the plane nearest to $y$.

That point is the orthogonal projection of $y$ onto the plane: drop a perpendicular from $y$, and where it lands is the fitted vector $\hat{y}$. The perpendicular itself is the residual, $y - \hat{y}$. This gives you three facts for free, without a single derivative:

- The residual is perpendicular to every column of $X$. That is the normal equations, $X^\top(y - X\beta) = 0$, read off a right angle.
- The residuals sum to zero whenever the model has an intercept, because the constant column is in the plane.
- Fitted values and residuals are uncorrelated, for the same reason.

Students memorise these as separate theorems. They are one picture.

### Where the eigenvalues come in

Projection explains fitting. To explain *how much* a model can capture, look at the shape of the data cloud itself.

Centre the features and form $X^\top X$. This matrix is symmetric, so the spectral theorem says it has an orthonormal set of eigenvectors with real, non-negative eigenvalues. Geometrically, the eigenvectors are the axes of the ellipsoid that best describes the cloud, and each eigenvalue is how far the cloud stretches along its axis.

Now ask: if I am only allowed to keep $k$ directions, which ones should I keep? The answer is the $k$ eigenvectors with the largest eigenvalues, and the fraction of the total variance you keep is

$$\frac{\lambda_1 + \dots + \lambda_k}{\lambda_1 + \dots + \lambda_p}.$$

That ratio is a number you can quote. "Two components explain 94% of the variance" is this fraction. Principal component analysis is nothing more than projecting the data onto its own longest axes, and the eigenvalues are the receipt for what was kept and what was thrown away.

### The same picture, three times

Once you see projection and spectrum as one story, three familiar things become the same thing:

1. **Least squares** projects $y$ onto the plane the features span.
2. **PCA** projects the features onto the directions they themselves vary most along.
3. **Ridge regression** shrinks the fit most along the directions with the smallest eigenvalues, which are exactly the directions where the data cannot tell you much. The penalty is not a hack; it is a way of trusting the short axes of the ellipsoid less.

The last one is the payoff. Regularisation looks arbitrary until you see which directions it is acting on.

### What to try on the board

- Draw $n = 3$, $p = 1$: three observations, a line through the origin in 3D, a point off the line, and the perpendicular. Compute $\hat{y}$ by projection and by the formula, and check they agree.
- Take a small centred data matrix, compute $X^\top X$, find its eigenvalues by hand, and sketch the ellipse. Then drop the smaller axis and see how much of each point survives.

## Conclusion

"Best fit" is not an optimisation slogan; it is a right angle. Least squares projects the data onto what the model can express, the residual is the perpendicular, and the eigenvalues of the data matrix say how much a smaller model keeps. Hold on to the picture and the formulas become things you can rederive rather than remember.

## References
1. Strang, G. *Introduction to Linear Algebra*, chapter on projections and least squares.
2. Hastie, Tibshirani and Friedman. *The Elements of Statistical Learning*, section on ridge regression and the singular value decomposition.
3. Axler, S. *Linear Algebra Done Right*, the spectral theorem.
