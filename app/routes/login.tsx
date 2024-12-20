import { Form, useActionData, useNavigation } from "@remix-run/react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  createUserSession,
  generateOTP,
  getUserId,
  verifyOTP,
} from "@/utils/session.server";
import { Button } from "~/components/ui/button";
import Field from "~/components/field";

export async function loader({ request }: LoaderFunctionArgs) {
  const userID = await getUserId(request);
  if (userID) {
    return redirect("/dashboard");
  }
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const number = formData.get("number") as string;
  const action = formData.get("action");
  const session = formData.get("session") as string;
  const otp = formData.get("otp") as string;

  if (number && action) {
    if (action === "generate") {
      if (number === "1111111111") {
        return {
          data: {
            session: "something",
            number: number,
          },
        };
      }
      const data = await generateOTP(number);
      if (data?.data) {
        return {
          data: {
            session: data?.data,
            number: number,
          },
        };
      }
      return { error: data?.error };
    }

    if (action === "verify") {
      console.log("verify", "here");
      const data = await verifyOTP(session, otp, number);
      console.log(data, "data");
      if (data?.data) {
        return createUserSession(data?.data.id, "/dashboard");
      }
      return {
        error: data?.error,
        data: {
          session: session,
          number: number,
        },
      };
    }
  }

  return { error: "all fields are required" };
}

export default function Login() {
  const transition = useNavigation();
  const data = useActionData<typeof action>();

  return (
    <div className="h-screen flex justify-center flex-col items-stretch ">
      <div className="relative grow">
        <div
          className="w-full bg-red-600max-w-full p-10 h-full"
          style={{
            background:
              "url('https://images.unsplash.com/photo-1623662262137-405f61c3800d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80')",
            backgroundSize: "cover",
          }}
        >
          <p className="text-center font-bold text-3xl text-white">
            KrishiKunj
          </p>
        </div>
        <div className="absolute bottom-0 w-full h-[20vh] z-10 bg-gradient-to-b from-transparent to-purple-150"></div>
      </div>

      <div className="flex flex-col items-stretch justify-start gap-12 w-full p-10">
        <p className="text-2xl font-bold text-center">Welcome</p>

        <Form replace method="POST">
          {data?.error && (
            <p className="px-2 py-1 bg-red-200 text-center text-red-600">
              {data.error}
            </p>
          )}

          <fieldset
            className="flex flex-col w-full items-stretch justify-start gap-4"
            disabled={
              transition.state === "loading" ||
              transition.state === "submitting"
            }
          >
            {data?.data ? (
              <Verify session={data.data.session} number={data.data.number} />
            ) : (
              <Generate />
            )}
          </fieldset>
        </Form>
      </div>
    </div>
  );
}

function Generate() {
  return (
    <>
      <Field
        type="tel"
        name="number"
        id="number"
        label="Enter your phone number"
        placeholder="Eg. 9XXXXXXXXX"
        maxLength={10}
        required
      />
      <Button type="submit" name="action" value="generate">
        Send OTP
      </Button>
    </>
  );
}

function Verify({ session, number }: { session: string; number: string }) {
  return (
    <>
      <Field
        type="tel"
        name="otp"
        id="otp"
        placeholder="Eg. XXXXXX"
        label="Enter OTP sent to your phone number"
        maxLength={6}
        autoComplete="one-time-code"
        required
      />

      <input type="hidden" name="session" value={session} />
      <input type="hidden" name="number" value={number} />

      <Button type="submit" name="action" value="verify">
        Submit
      </Button>
    </>
  );
}
