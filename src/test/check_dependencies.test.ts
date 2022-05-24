
import { checkJava, checkPylint, UserFacingVersionChecker } from '../check_dependencies';
import * as vscode from 'vscode';
import chai from 'chai';
import spies from 'chai-spies';
import { expect } from 'chai';
import { after } from 'mocha';
import { MessageShower } from '../utils';
import { Config } from '../config';

chai.use(spies);

enum Dependencies {
    Present = 'present',
    Missing = 'missing',
    Outdated = 'outdated'
}

suite('test dependency checking',  () => {
    after(() => { vscode.window.showInformationMessage('dependency checking tests complete!') });

    const dependencies: Dependencies = (() => {
        const dependenciesString = process.env.dependencies.toLowerCase();
        for (const v in Dependencies) {
            if (v.toLowerCase() === dependenciesString) return Dependencies[v];
        }
        throw new Error(
            `"${dependenciesString}" is not a valid dependency state.
            Acceptable values are "${Object.keys(Dependencies).join('", "')}"`
        );
    })();

    type Spy = ChaiSpies.SpyFunc1Proxy<string, Thenable<string>>;

    function getMockMessageShower(): Spy {
        const mock: MessageShower = (message: string, ...items: string[]) => Promise.resolve('');
        return chai.spy(mock);
    };

    const expectSuccess = async (checker: UserFacingVersionChecker, spy: Spy) => {
        expect(await checker(spy)()).to.be.true;
        expect(spy).not.to.have.been.called;
    };
    const expectFailure = async (checker: UserFacingVersionChecker, spy: Spy) => {
        expect(await checker(spy)()).to.be.false;
        expect(spy).to.have.been.called;
    };

    test('java', async () => {
        const spy = getMockMessageShower();
        switch (dependencies) {
        case Dependencies.Present:
            await expectSuccess(checkJava, spy);
            break;
        case Dependencies.Missing:
        case Dependencies.Outdated:
            await expectFailure(checkJava, spy);
            expect(spy).to.have.been.called.with(
                `Java version ${Config.javaVersion.major} is required for Lingua Franca diagrams `
                + `and code analysis.`
            );
            break;
        }
    });

    test('pylint', async () => {
        const spy = getMockMessageShower();
        switch (dependencies) {
        case Dependencies.Present:
            await expectSuccess(checkPylint, spy);
            break;
        case Dependencies.Missing:
            await expectFailure(checkPylint, spy);
            expect(spy).to.have.been.called.with(
                `Pylint is a recommended linter for Lingua Franca's Python target.`
            );
            break;
        case Dependencies.Outdated:
            await expectFailure(checkPylint, spy);
            expect(spy).to.have.been.called.with(
                `The Lingua Franca language server is tested with Pylint version `
                + `${Config.pylintVersion.major}.${Config.pylintVersion.minor} and newer.`
            );
            break;
        }
    });
});
